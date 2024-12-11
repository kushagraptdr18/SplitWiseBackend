const mongoose = require('mongoose');
const groupModel = require('../models/groupModel');
const expenseModel = require('../models/expenseModel');
module.exports.expensesCreateController = async function (req, res) {
  try {
    console.log(req.body);
    
    const { groupId, description, amount, paidBy, participants } = req.body;
    const loggedUserId = req.user._id;

    // Validate required fields
    if (!groupId || !description || !amount || !paidBy || !participants || participants.length === 0) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Fetch the group
    const group = await groupModel.findById(groupId).populate('members');
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Check if the logged-in user is part of the group
    const groupMemberIds = group.members.map((member) => member._id.toString());
    if (!groupMemberIds.includes(loggedUserId.toString())) {
      return res.status(403).json({ message: 'You are not a member of this group.' });
    }

    // Validate that all participants are members of the group
    const invalidParticipants = participants.filter((id) => !groupMemberIds.includes(id));
    if (invalidParticipants.length > 0) {
      return res.status(400).json({ message: 'Some participants are not members of the group.' });
    }

    // Validate that the payer (paidBy) is also a member of the group
    if (!groupMemberIds.includes(paidBy)) {
      return res.status(400).json({ message: 'The payer is not a member of the group.' });
    }

    // Calculate the split amounts
    const perPersonShare = parseFloat((amount / participants.length).toFixed(2));
    const splitDetails = participants.map((participant) => ({
      user: participant,
      amountOwed: participant === paidBy ? 0 : perPersonShare, // Payer owes nothing
    }));

    // Create the expense
    const expense = new expenseModel({
      group: groupId,
      description,
      amount,
      paidBy,
      participants,
      splitDetails,
    });

    const savedExpense = await expense.save();

    res.status(201).json({
      message: 'Expense created and split successfully.',
      expense: savedExpense,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while creating the expense.', error: error.message });
  }
};

module.exports.viewAllExpensesForGroup = async (req, res) => {
  try {
    const loggedUserId = req.user._id; // The logged-in user's ID
    const { groupId } = req.query; // Get the groupId from the URL parameter

    // Step 1: Fetch the group by ID and check if the logged user is a member of the group
    const group = await groupModel.findById(groupId).populate('members', 'name');
    
    if (!group || !group.members.some(member => member._id.toString() === loggedUserId.toString())) {
      return res.status(403).json({ message: 'You are not a member of this group.' });
    }

    // Step 2: Fetch all expenses related to this group
    const expenses = await expenseModel.find({ group: group._id })
      .populate('paidBy', 'name')
      .populate('splitDetails.user', 'name')
      .sort({ createdAt: -1 }); // Sort by creation date, descending order

    // Step 3: Prepare the expense details including the financial status for the logged-in user
    const expenseDetails = expenses.map((expense) => {
      const expenseInfo = {
        description: expense.description,
        amount: expense.amount,
        date: expense.createdAt, // Date of expense creation
        paidBy: expense.paidBy.name, // Name of the person who paid the expense
        splitDetails: expense.splitDetails.map((split) => {
          const participantId = split.user._id.toString();
          const isOwed = participantId === loggedUserId.toString() && expense.paidBy._id.toString() !== loggedUserId.toString();
          const isPaying = expense.paidBy._id.toString() === loggedUserId.toString() && participantId !== loggedUserId.toString();
          
          // Determine the logged user's status on each expense part
          return {
            user: split.user.name,
            amountOwed: split.amountOwed,
            status: isOwed ? 'To Take' : isPaying ? 'To Pay' : 'No Action',
          };
        }),
      };

      return expenseInfo;
    });

    // Step 4: Send response
    res.status(200).json({
      message: 'Expenses for the group retrieved successfully.',
      expenses: expenseDetails,
    });
  } catch (error) {
    console.error('Error retrieving expenses for the group:', error);
    res.status(500).json({ message: 'An error occurred while retrieving expenses.', error: error.message });
  }
};

module.exports.viewMonthlyUserExpense =async (req, res) => {
  try {
    // Ensure user ID is properly formatted
    const userId = new mongoose.Types.ObjectId(req.user.id); // Add 'new' here to convert user ID to ObjectId
  
    // Aggregation pipeline to calculate daily expenses for a specific user
    const dailyExpenses = await expenseModel.aggregate([
      {
        $match: { paidBy: userId }, // Match expenses paid by the logged-in user
      },
      {
        $project: {
          day: { $dayOfMonth: '$createdAt' }, // Extract the day of the month from createdAt
          month: { $month: '$createdAt' }, // Extract the month
          year: { $year: '$createdAt' }, // Extract the year
          amount: 1, // Include the amount field
        },
      },
      {
        $group: {
          _id: { year: '$year', month: '$month', day: '$day' }, // Group by year, month, and day
          totalAmount: { $sum: '$amount' }, // Sum the amounts for that day
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }, // Sort by year, month, and day
    ]);
  
    // Transforming the response for readability (optional)
    const transformedExpenses = dailyExpenses.map((expense) => ({
      year: expense._id.year,
      month: expense._id.month,
      day: expense._id.day,  // Add the day field
      totalAmount: expense.totalAmount,
    }));
  
    // Send the response with daily expenses
    res.status(200).json(transformedExpenses);
  } catch (error) {
    console.error('Error fetching daily expenses:', error);
    res.status(500).json({ error: 'Failed to fetch daily expenses' });
  }
  
    
}

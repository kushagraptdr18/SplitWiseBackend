const groupModel = require('../models/groupModel')
const userModel = require('../models/userModel')
const expenseModel = require('../models/expenseModel')


module.exports.creatingGroupControllers= async (req,res)=>{
  try {
    const { name, members } = req.body;

    // Validate inputs
    if (!name || !Array.isArray(members)) {
      return res.status(400).json({ message: 'Group name and members are required.' });
    }

    // Add the logged-in user to the members array and remove duplicates
    const loggedUserId = req.user._id; // The logged-in user's ID
    const uniqueMembers = [...new Set([...members, loggedUserId])];

    
    const validUsers = await userModel.find({ _id: { $in: uniqueMembers } });
    if (validUsers.length !== uniqueMembers.length) {
      return res.status(400).json({ message: 'Some member IDs are invalid.' });
    }

    // Create the group
    const group = new groupModel({
      name,
      createdBy: loggedUserId,
      members: uniqueMembers,
    });

    const savedGroup = await group.save();

    res.status(201).json({
      message: 'Group created successfully.',
      group: savedGroup,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while creating the group.', error: error.message });
  }
    
}
module.exports.updatingGroupController = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, newMembers, removeMembers } = req.body;

    // Fetch the group
    const group = await groupModel.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Ensure that only the creator can update the group
    const loggedUserId = req.user._id.toString();
    if (group.createdBy.toString() !== loggedUserId) {
      return res.status(403).json({ message: 'Only the group creator can update this group.' });
    }

    // Ensure the creator is always part of the members
    if (!group.members.includes(group.createdBy.toString())) {
      group.members.push(group.createdBy.toString());
    }

    // Update group name if provided
    if (name) {
      group.name = name;
    }

    // Handle adding new members
    if (newMembers && newMembers.length > 0) {
      // Validate that all new members exist in the database
      const validNewMembers = await userModel.find({ _id: { $in: newMembers } }).select('_id');
      const validNewMemberIds = validNewMembers.map((user) => user._id.toString());

      // Add only unique members not already in the group
      validNewMemberIds.forEach((id) => {
        if (!group.members.includes(id)) {
          group.members.push(id);
        }
      });
    }

    // Handle removing members
    if (removeMembers && removeMembers.length > 0) {
      // Filter out members to remove, but ensure the creator cannot be removed
      group.members = group.members.filter((memberId) => {
        return !removeMembers.includes(memberId.toString()) && memberId.toString() !== group.createdBy.toString();
      });
    }

    // Save the updated group
    const updatedGroup = await group.save();

    res.status(200).json({
      message: 'Group updated successfully.',
      group: updatedGroup,
    });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ message: 'An error occurred while updating the group.', error: error.message });
  }
};

module.exports.viewGroupsWithFinancialDetails = async (req, res) => {
  try {
    const loggedUserId = req.user._id; // The logged-in user's ID

    // Step 1: Fetch all groups where the logged-in user is a member
    const groups = await groupModel.find({ members: loggedUserId }).populate('members', 'name');

    // Step 2: Initialize response
    const groupDetails = [];

    for (const group of groups) {
      // Step 3: Fetch all expenses related to this group
      const expenses = await expenseModel.find({ group: group._id })
        .populate('paidBy', 'name')
        .populate('splitDetails.user', 'name');

      // Step 4: Initialize financial balances
      let toPay = []; // List of users to whom logged user needs to pay
      let toTake = []; // List of users from whom logged user needs to take money

      // Step 5: Process each expense
      expenses.forEach((expense) => {
        expense.splitDetails.forEach((split) => {
          const participantId = split.user._id.toString();

          // If logged-in user owes money
          if (participantId === loggedUserId.toString() && expense.paidBy._id.toString() !== loggedUserId.toString()) {
            // Add the user to whom money needs to be paid
            toPay.push({
              name: expense.paidBy.name,
              amount: split.amountOwed,
            });
          }

          // If logged-in user is owed money
          if (expense.paidBy._id.toString() === loggedUserId.toString() && participantId !== loggedUserId.toString()) {
            // Add the user from whom money needs to be taken
            toTake.push({
              name: split.user.name,
              amount: split.amountOwed,
            });
          }
        });
      });

      // Step 6: Prepare final data for the group
      groupDetails.push({
        id:group._id,
        groupName: group.name,
        toPay, // List of people to pay and their amounts
        toTake, // List of people to take from and their amounts
      });
    }

    // Step 7: Send response
    res.status(200).json({
      message: 'Groups with financial details retrieved successfully.',
      groups: groupDetails,
    });
  } catch (error) {
    console.error('Error retrieving groups and financial details:', error);
    res.status(500).json({ message: 'An error occurred while retrieving groups and financial details.', error: error.message });
  }
};

module.exports.viewEachGroupFinancialDetails = async (req, res) => {
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
      .populate('splitDetails.user', 'name');

    // Step 3: Initialize financial balances
    let toPay = []; // List of users to whom logged user needs to pay
    let toTake = []; // List of users from whom logged user needs to take money

    // Step 4: Process each expense
    expenses.forEach((expense) => {
      expense.splitDetails.forEach((split) => {
        const participantId = split.user._id.toString();

        // If logged-in user owes money
        if (participantId === loggedUserId.toString() && expense.paidBy._id.toString() !== loggedUserId.toString()) {
          // Add the user to whom money needs to be paid
          toPay.push({
            name: expense.paidBy.name,
            amount: split.amountOwed,
          });
        }

        // If logged-in user is owed money
        if (expense.paidBy._id.toString() === loggedUserId.toString() && participantId !== loggedUserId.toString()) {
          // Add the user from whom money needs to be taken
          toTake.push({
            name: split.user.name,
            amount: split.amountOwed,
          });
        }
      });
    });

    // Step 5: Prepare final data for the group
    const groupDetails = {
      groupName: group.name,
      toPay, // List of people to pay and their amounts
      toTake, // List of people to take from and their amounts
    };
    console.log(groupDetails);
    

    // Step 6: Send response
    res.status(200).json({
      message: 'Group financial details retrieved successfully.',
      group: groupDetails,
    });
  } catch (error) {
    console.error('Error retrieving group financial details:', error);
    res.status(500).json({ message: 'An error occurred while retrieving group financial details.', error: error.message });
  }
};



module.exports.viewGroupMembers = async (req, res) => {
  const { groupId } = req.query; // Extract groupId from the query parameter
  
  try {
    // Assuming user authentication is handled via JWT
    const loggedInUserId = req.user._id; // req.user is populated if you're using something like passport.js or JWT middleware
    
    if (!groupId) {
      return res.status(400).json({ message: "Group ID is required" });
    }

    // Find the group using the groupId
    const group = await groupModel.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Find all users who are part of the group (including the logged-in user)
    const members = await userModel.find({
      _id: { $in: group.members } // Assuming group has a "members" field which is an array of user IDs
    });

    // Check if the logged-in user is part of the group
    const loggedInUser = await userModel.findById(loggedInUserId);

    if (!loggedInUser) {
      return res.status(404).json({ message: "Logged-in user not found" });
    }

    // Include the logged-in user in the members list if not already there
    if (!members.some(user => user._id.toString() === loggedInUser._id.toString())) {
      members.push(loggedInUser);
    }

    // Return the list of group members
    res.status(200).json({
      group: group.name,
      members: members.map(member => ({
        id: member._id,
        name: member.name,
        email: member.email
      }))
    });
  } catch (error) {
    console.error('Error fetching group members:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};


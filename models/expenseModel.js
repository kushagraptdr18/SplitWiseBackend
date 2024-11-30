const mongoose = require('mongoose');



const expenseSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true }, // Group ID
  description: { type: String, required: true }, // e.g., "Dinner at XYZ"
  amount: { type: Number, required: true },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Who paid for the expense
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }], // People sharing this expense
  splitDetails: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // User ID
      amountOwed: { type: Number }, // How much they owe
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Expense', expenseSchema);

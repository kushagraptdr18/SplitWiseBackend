const express = require('express');
const { expensesCreateController, viewExpensesController, viewAllExpensesForGroup, viewMonthlyUserExpense } = require('../controllers/expenseController');
const { isLoggedIn } = require('../middlewares/Authentication');
const route = express.Router();

route.post("/create",isLoggedIn,expensesCreateController)
route.get("/view",isLoggedIn,viewAllExpensesForGroup)
route.get('/user/expenses/monthly', isLoggedIn, viewMonthlyUserExpense);





module.exports = route;
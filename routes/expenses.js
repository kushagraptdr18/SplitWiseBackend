const express = require('express');
const { expensesCreateController, viewExpensesController, viewAllExpensesForGroup } = require('../controllers/expenseController');
const { isLoggedIn } = require('../middlewares/Authentication');
const route = express.Router();

route.post("/create",isLoggedIn,expensesCreateController)
route.get("/view",isLoggedIn,viewAllExpensesForGroup)





module.exports = route;
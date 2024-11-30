const express = require('express');
const route = express.Router();
const {group, creatingGroupControllers, getGroupControllers, getParticularGroupControllers, updatingGroupController, viewGroupsWithFinancialDetails, viewEachGroupFinancialDetails, viewGroupMembers}=require("../controllers/gruopController");
const { isLoggedIn } = require('../middlewares/Authentication');


route.post('/create',isLoggedIn,creatingGroupControllers);
route.put('/update/:groupId',isLoggedIn,updatingGroupController);
route.get("/viewAllGroups",isLoggedIn,viewGroupsWithFinancialDetails);
route.get("/viewGroup",isLoggedIn,viewEachGroupFinancialDetails);
route.get("/groupMembers",isLoggedIn,viewGroupMembers)



module.exports = route;
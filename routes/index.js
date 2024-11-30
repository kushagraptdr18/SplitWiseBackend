const express = require('express');
const { loginPageController, registerPageController, logoutPageController, frontPageController, showPageController, viewFriendsAndCommonGroups, userDetails, viewAllFriends } = require('../controllers/indexController');
const { isLoggedIn } = require('../middlewares/Authentication');
const route = express.Router();


route.post("/register",registerPageController)  
route.post("/login", loginPageController)
route.get("/logout", isLoggedIn,logoutPageController)
route.get("/userDetails",isLoggedIn,userDetails)
route.get("/freinds",isLoggedIn,viewFriendsAndCommonGroups)
route.get("/allfriends",isLoggedIn,viewAllFriends)



module.exports = route;


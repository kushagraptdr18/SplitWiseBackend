const userModel = require("../models/userModel")
const groupModel = require("../models/groupModel")
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')
require('dotenv').config();
const secretKey = process.env.SECRET_KEY;


module.exports.registerPageController=async (req,res)=>{
    let{name,contact,email,password}=req.body
    

    const check=await userModel.findOne({email});
    if(check)return res.send("already registered");
    
    //new registration 
    
        bcrypt.genSalt(10,async function(err,salt){
            bcrypt.hash(password,salt,async function(err,hash)
           {
           const user= await userModel.create({name, contact, email, password:hash });
           const token = jwt.sign({ id: user._id, email: user.email }, secretKey);
        
        // Set a cookie named 'token' with the generated JWT
        res.cookie('token', token, {
          httpOnly: true,  // Only accessible via HTTP (not through JavaScript)
          secure: false,  // Set to true if using HTTPS
          maxAge: 24 * 60 * 60 * 1000  // 1 day in milliseconds
        });
        return res.status(201).json({ message: "Registered successfully" });

          })
          
    
        })
           
        }
    
module.exports.loginPageController = async (req, res) => {
    let { email, password } = req.body;
    
    let user = await userModel.findOne({ email });
    
    if (!user) return res.send("Kindly register.");
    
    bcrypt.compare(password, user.password, function(err, result) {
      if (result) {
        const token = jwt.sign({ id: user._id, email: user.email }, secretKey);
        
        // Set a cookie named 'token' with the generated JWT
        res.cookie('token', token);
        

        res.send({ message: "Successfully Login", token: token });
      } else {
        res.send("Invalid credentials.");
      }
    });
  };

module.exports.logoutPageController=(req,res)=>{
    res.cookie("token","");
    res.send("you have logged out")
}


module.exports.viewFriendsAndCommonGroups = async (req, res) => {
    try {
      const loggedUserId = req.user._id; // The logged-in user's ID
  
      // Step 1: Fetch all groups where the logged-in user is a member
      const userGroups = await groupModel.find({ members: loggedUserId }).populate('members', 'name');
  
      // Step 2: Collect all members from the groups (excluding the logged-in user)
      const friendsMap = new Map(); // Track friends and their common groups
      userGroups.forEach((group) => {
        group.members.forEach((member) => {
          if (member._id.toString() !== loggedUserId.toString()) {
            if (!friendsMap.has(member._id.toString())) {
              friendsMap.set(member._id.toString(), {
                friendId: member._id,
                friendName: member.name,
                commonGroups: [],
              });
            }
            friendsMap.get(member._id.toString()).commonGroups.push(group.name);
          }
        });
      });
  
      // Step 3: Fetch all users in the database
      const allUsers = await userModel.find({ _id: { $ne: loggedUserId } }).select('name');
  
      // Step 4: Format the response to include all friends
      const friendsWithDetails = allUsers.map((user) => {
        const friendId = user._id.toString();
        if (friendsMap.has(friendId)) {
          // Friend is in common groups
          return {
            friendName: user.name,
            commonGroups: friendsMap.get(friendId).commonGroups,
          };
        }
        // Friend is not in any common group
        return {
          friendName: user.name,
          commonGroups: [],
        };
      });
  
      res.status(200).json({
        message: 'Friends and their common groups retrieved successfully.',
        friends: friendsWithDetails,
      });
    } catch (error) {
      console.error('Error retrieving friends and common groups:', error);
      res.status(500).json({ message: 'An error occurred while retrieving friends and common groups.', error: error.message });
    }
  };


  module.exports.viewAllFriends = async (req, res) => {
    try {
      // Get the logged-in user's ID from the token or session (assuming JWT)
      const loggedInUserId = req.user._id; // This assumes the user ID is attached to the request object (via middleware)
  
      // Fetch all users except the logged-in user
      const users = await userModel.find({ _id: { $ne: loggedInUserId } }).select('_id name');
  
      // If no users are found, return a 404 response
      if (!users.length) {
        return res.status(404).json({ message: 'No friends found.' });
      }
  
      // Return the list of users (name and id) as a response
      res.status(200).json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error while fetching users.' });
    }
  };

  module.exports.userDetails = async (req,res)=>{
    try{
        const user=await userModel.findById(req.user._id).select('-password');
        if(!user){
            return res.status(404).json({message:"user not found"})
        }
        res.status(200).json({user})
    }
    catch(error){
        console.error('Error retrieving user details:', error);
        res.status(500).json({ message: 'An error occurred while retrieving user details.', error: error.message });
    }
  }
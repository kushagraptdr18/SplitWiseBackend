const cookieParser=require("cookie-parser")
const jwt=require("jsonwebtoken")
const userModel = require("../models/userModel")
require('dotenv').config();
const secretKey = process.env.SECRET_KEY;

module.exports.isLoggedIn=async function(req,res,next) {
    const token=req.cookies.token;
    if(token)
    {
        jwt.verify(token,secretKey,async function(err,decoded){
            let{email,password}=decoded
            let user=await userModel.findOne({email})
            if(user)
            {
                req.user=user;
                next();
            }
            else
            {
                res.send("please log in");
            }
        } )
    }
    

   else {res.send("not logged in")}
        }
    
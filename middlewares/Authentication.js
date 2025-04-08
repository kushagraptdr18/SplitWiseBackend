const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const { response } = require("express");
require("dotenv").config();
const secretKey = process.env.SECRET_KEY;

module.exports.isLoggedIn = async function (req, res, next) {
    try {
        // Get token from cookie or authorization header
        const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(" ")[1]);

        
        
        if (!token) {
                 
            return res.status(401).json({ message: "Not logged in" });
        }

        // Verify token
        jwt.verify(token, secretKey, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: "Invalid or expired token" });
            }

            const { email } = decoded;

            try {
                const user = await userModel.findOne({ email });
                if (!user) {
                    return res.status(401).json({ message: "User not found. Please log in." });
                }
                req.user = user;
                next();
            } catch (dbErr) {
                return res.status(500).json({ message: "Database error", error: dbErr });
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Something went wrong", error });
    }
};

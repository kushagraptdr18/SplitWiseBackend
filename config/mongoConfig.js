const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URL)
const db = mongoose.connection;

db.on("error",(err)=>{
    console.log(err);
})

db.on("open",()=>{
    console.log("Connected to MongoDB");
})

module.exports = db;

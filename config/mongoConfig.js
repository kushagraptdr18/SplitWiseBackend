const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://minor:a8ctCawHrsWLnCjw@cluster0.i7d1t.mongodb.net/MINORPROJECT")
const db = mongoose.connection;

db.on("error",(err)=>{
    console.log(err);
})

db.on("open",()=>{
    console.log("Connected to MongoDB");
})

module.exports = db;

const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const db = require("./config/mongoConfig");
const cookieParser = require('cookie-parser');
const userModel = require('./models/userModel');
const expressSession = require('express-session');
const port = process.env.PORT || 3000;

// Enable CORS for all requests
// const cors = require('cors');

app.use(cors({
  origin: true,
  credentials: true
}));

// Setup session middleware
app.use(
  expressSession({
    resave: false, // Don't save session if not modified
    saveUninitialized: false, // Don't create session until something is stored
    secret: "hh", // Session secret key for signing the session ID cookie
    cookie: { secure: false }, // Set to true if using https
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// Define routes
const indexRouter = require("./routes/index");
const groupRouter = require("./routes/group");
const expenseRouter = require("./routes/expenses");

app.use("/auth", indexRouter);
app.use("/group", groupRouter);
app.use("/expense", expenseRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

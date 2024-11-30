const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const db = require("./config/mongoConfig");
const cookieParser = require('cookie-parser');
const userModel = require('./models/userModel');
const expressSession = require('express-session');

// Enable CORS for all requests
// const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173',  // Frontend URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true,  // Allow credentials (cookies) to be sent
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

app.use("/", indexRouter);
app.use("/group", groupRouter);
app.use("/expense", expenseRouter);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

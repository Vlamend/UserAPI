require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

const userRoutes = require("./auth.js");

const app = express();

// Middleware
const corsOptions = {
  origin: "*", 
  methods: "GET,POST,PUT,PATCH,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  exposedHeaders: "Authorization",
};

// Connect to MongoDB
const uri = process.env.DATABASE_URL;
mongoose.connect(uri)
  .then(() => console.log('Connection to database successful'))
  .catch((err) => console.error('Error during database connection:', err));

app.use(cors(corsOptions));
app.use(express.json());

// Strict limit for auth endpoints — prevents brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: "Too many requests, please try again later." },
});

// Generous limit for general API usage
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later." },
});

// Route
app.use("/user/login", authLimiter);
app.use("/user/register", authLimiter);
app.use("/user", apiLimiter, userRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error." });
});

// Start server
app.listen(process.env.PORT || 5000, "0.0.0.0", () => {
  console.log(`Server listening on ${process.env.PORT}`);
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed.");
  process.exit(0);
});

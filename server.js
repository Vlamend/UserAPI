require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const userRoutes = require("./user.js");

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
app.use(bodyParser.urlencoded({ extended: true }));

// Route
app.use('/user', userRoutes);

// Error handler
app.use((err, res) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Avvio del server
app.listen(process.env.PORT, () => {
  console.log(`Server listening on http://localhost:${process.env.PORT}`);
});
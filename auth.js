const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("./models/user.js");

const router = express.Router();

// Fallback to 10 if SALT_ROUNDS is missing or not a valid number
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 10;

// ---------------------------------------------------------------------------
// Authentication middleware
// Validates the Bearer token from the Authorization header and attaches
// the full user document to req.user for use in downstream route handlers.
// ---------------------------------------------------------------------------
const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. Token not provided." });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ sessionKey: token });
    if (!user) {
      return res.status(401).json({ message: "Invalid token or user not found." });
    }

    req.user = user; // Attach user document so routes don't need extra DB queries
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      await User.updateOne(
        { sessionKey: token },
        { $pull: { sessionKey: token } }
      );
      return res.status(401).json({ message: "Token expired." });
    }

    console.error("Authentication error:", error.message);
    return res.status(403).json({ message: "Invalid token." });
  }
};

// ---------------------------------------------------------------------------
// POST /login
// ---------------------------------------------------------------------------
router.post("/login", async (req, res) => {
  // Cast to String to prevent NoSQL injection
  const user = String(req.body.user || "");
  const psw = String(req.body.psw || "");

  try {
    const foundUser = await User.findOne({ username: user });

    // FIX: Use a generic error message for both "user not found" and "wrong password"
    // to prevent user enumeration attacks.
    const isMatch = foundUser ? await foundUser.comparePassword(psw) : false;
    if (!foundUser || !isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { userId: foundUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    foundUser.sessionKey.push(token);
    await foundUser.save();

    res.setHeader("Authorization", `Bearer ${token}`);
    res.json({
      message: "Login successful.",
      user: { id: foundUser._id, username: foundUser.username },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ---------------------------------------------------------------------------
// POST /register
// ---------------------------------------------------------------------------
router.post("/register", async (req, res) => {
  const user = String(req.body.user || "");
  const psw = String(req.body.psw || "");
  const nome = String(req.body.nome || "");
  const birth = String(req.body.birth || "");
  const mail = String(req.body.mail || "");

  try {
    const existingUser = await User.findOne({ username: user });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists." });
    }

    const newUser = new User({
      username: user,
      password: psw,
      Name: nome,
      birthDate: birth,
      email: mail || undefined,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ---------------------------------------------------------------------------
// POST /update  (protected)
// FIX: Route is now protected by authenticateToken.
// FIX: The user is identified via req.user (set by the middleware) instead of
//      trusting a token value sent in the request body, which would have
//      allowed any authenticated user to update any other user's data.
// FIX: Password hashing is handled here manually via bcrypt because
//      findOneAndUpdate bypasses Mongoose's pre("save") middleware.
// ---------------------------------------------------------------------------
router.post("/update", authenticateToken, async (req, res) => {
  const user = String(req.body.user || "");
  const psw = String(req.body.psw || "");
  const nome = String(req.body.nome || "");
  const birth = String(req.body.birth || "");

  const updatedData = {};

  try {
    if (user) updatedData.username = user;
    if (nome) updatedData.Name = nome;
    if (birth) updatedData.birthDate = birth;
    if (psw) {
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      updatedData.password = await bcrypt.hash(psw, salt);
    }

    await User.findByIdAndUpdate(req.user._id, updatedData, { new: true });
    res.json({ message: "Data updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ---------------------------------------------------------------------------
// POST /logout
// ---------------------------------------------------------------------------
router.post("/logout", async (req, res) => {
  const token = String(req.body.token || "");

  await User.findOneAndUpdate(
    { sessionKey: token },
    { $pull: { sessionKey: token } },
    { new: true }
  );

  res.json({ message: "Logout successful." });
});

// ---------------------------------------------------------------------------
// GET /getUserFullName  (protected)
// FIX: Uses req.user set by authenticateToken instead of running a second
//      redundant database query.
// ---------------------------------------------------------------------------
router.get("/getUserFullName", authenticateToken, (req, res) => {
  const capitalizeEachWord = (str) =>
    str
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  try {
    const fullName = capitalizeEachWord(req.user.Name);
    res.status(200).json({ fullName });
  } catch (error) {
    console.error("Error retrieving full name:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ---------------------------------------------------------------------------
// GET /getUserID  (protected)
// FIX: Uses req.user instead of a second DB query.
// FIX: Returns the ObjectId as-is. The previous .replace(/\D/g, "") stripped
//      all letters from the hex string, producing a completely invalid ID.
// ---------------------------------------------------------------------------
router.get("/getUserID", authenticateToken, (req, res) => {
  try {
    res.status(200).json({ id: req.user._id.toString() });
  } catch (error) {
    console.error("Error retrieving user ID:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ---------------------------------------------------------------------------
// GET /isSubscribed  (protected)
// FIX: Uses req.user instead of a second DB query.
// FIX: subState is now a plain Boolean in the schema, so no array unwrapping needed.
// ---------------------------------------------------------------------------
router.get("/isSubscribed", authenticateToken, (req, res) => {
  try {
    res.status(200).json({ subscribed: req.user.subState });
  } catch (error) {
    console.error("Error retrieving subscription state:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ---------------------------------------------------------------------------
// PATCH /updateSubscriptionState  (protected)
// ---------------------------------------------------------------------------
router.patch("/updateSubscriptionState", authenticateToken, async (req, res) => {
  try {
    const { subState } = req.body;

    if (typeof subState !== "boolean") {
      return res.status(400).json({ message: "Invalid subscription state value." });
    }

    await User.findByIdAndUpdate(req.user._id, { $set: { subState } });
    res.json({ message: "Subscription state updated successfully." });
  } catch (error) {
    console.error("Error updating subscription state:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ---------------------------------------------------------------------------
// GET /protected-route  — example of a protected endpoint
// ---------------------------------------------------------------------------
router.get("/protected-route", authenticateToken, (req, res) => {
  res.json({ message: "Access granted.", user: req.user });
});

module.exports = router;
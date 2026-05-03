const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cron = require("node-cron");
 
// Fallback to 10 if SALT_ROUNDS is missing or not a valid number
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 10;
 
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    Name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator: function (value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return !value || emailRegex.test(value);
        },
        message: "E-mail not valid.",
      },
    },
    birthDate: {
      type: Date,
      default: null,
    },
    password: {
      type: String,
      required: true,
    },
    sessionKey: [{ type: String }],
 
    subState: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);
 
// Hash the password before saving (only if it was modified or the document is new)
userSchema.pre("save", async function (next) {
  if (this.isModified("password") || this.isNew) {
    try {
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});
 
// Method to compare a candidate password against the stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
 
const User = mongoose.model("User", userSchema);
 
// Clear all session keys — called by the cron job below
const clearSessionKeys = async () => {
  try {
    await User.updateMany({}, { $set: { sessionKey: [] } });
  } catch (error) {
    console.error("Error cleaning session keys:", error);
  }
};
 
// Run session cleanup every hour
cron.schedule("0 * * * *", clearSessionKeys);
 
module.exports = User;
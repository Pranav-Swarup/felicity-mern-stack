import { Router } from "express";
import { Participant, Organizer, Admin } from "../models/index.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signToken } from "../utils/token.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// only participants self-register
router.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName, college, contactNumber } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // figure out participant type from email domain
    const isIIIT = email.toLowerCase().endsWith("@iiit.ac.in") ||
                   email.toLowerCase().endsWith("@students.iiit.ac.in") ||
                   email.toLowerCase().endsWith("@research.iiit.ac.in");

    // for IIIT participants, enforce domain
    // for non-IIIT, any email is fine — but check it's a valid-ish format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (contactNumber && !/^\d{10}$/.test(contactNumber.trim())) {
      return res.status(400).json({ error: "Phone number must be exactly 10 digits" });
    }

    // check if email already taken across all collections
    const existsP = await Participant.findOne({ email: email.toLowerCase() });
    const existsO = await Organizer.findOne({ email: email.toLowerCase() });
    const existsA = await Admin.findOne({ email: email.toLowerCase() });
    if (existsP || existsO || existsA) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashed = await hashPassword(password);
    const participant = await Participant.create({
      email: email.toLowerCase(),
      password: hashed,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      participantType: isIIIT ? "iiit" : "non-iiit",
      college: college?.trim() || "",
      contactNumber: contactNumber?.trim() || "",
    });

    const token = signToken({
      userId: participant._id,
      role: "participant",
    });

    // console.log("registered participant:", participant.email);

    res.status(201).json({
      token,
      user: participant.toJSON(),
      role: "participant",
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Email already registered" });
    }
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// unified login — role is sent from the frontend
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: "Email, password, and role are required" });
    }

    const lowerEmail = email.toLowerCase();
    let user = null;

    if (role === "participant") {
      user = await Participant.findOne({ email: lowerEmail });
    } else if (role === "organizer") {
      user = await Organizer.findOne({ email: lowerEmail });
      if (user && user.isDisabled) {
        return res.status(403).json({ error: "This account has been disabled by the admin" });
      }
      if (user && user.isArchived) {
        return res.status(403).json({ error: "This account has been archived" });
      }
    } else if (role === "admin") {
      user = await Admin.findOne({ email: lowerEmail });
    } else {
      return res.status(400).json({ error: "Invalid role" });
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken({ userId: user._id, role });

    // console.log("login:", lowerEmail, role);

    res.json({
      token,
      user: user.toJSON(),
      role,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// get current user info (used to restore session on page refresh)
router.get("/me", authenticate, async (req, res) => {
  try {
    const { userId, role } = req.user;
    let user = null;

    if (role === "participant") {
      user = await Participant.findById(userId);
    } else if (role === "organizer") {
      user = await Organizer.findById(userId);
    } else if (role === "admin") {
      user = await Admin.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: user.toJSON(), role });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;

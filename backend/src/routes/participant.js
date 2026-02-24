import { Router } from "express";
import { Participant } from "../models/index.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/role.js";
import { hashPassword, comparePassword } from "../utils/password.js";

const router = Router();

router.use(authenticate);
router.use(authorize("participant"));

// get profile
router.get("/profile", async (req, res) => {
  try {
    const participant = await Participant.findById(req.user.userId)
      .populate("followedOrganizers", "organizerName category");
    if (!participant) return res.status(404).json({ error: "Not found" });
    res.json({ user: participant.toJSON() });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// update profile
router.put("/profile", async (req, res) => {
  try {
    const { firstName, lastName, contactNumber, college, interests } = req.body;

    if (contactNumber && !/^\d{10}$/.test(contactNumber.trim())) {
      return res.status(400).json({ error: "Phone number must be exactly 10 digits" });
    }

    const update = {};
    if (firstName !== undefined) update.firstName = firstName.trim();
    if (lastName !== undefined) update.lastName = lastName.trim();
    if (contactNumber !== undefined) update.contactNumber = contactNumber.trim();
    if (college !== undefined) update.college = college.trim();
    if (interests !== undefined) update.interests = interests;

    const participant = await Participant.findByIdAndUpdate(
      req.user.userId,
      { $set: update },
      { new: true }
    ).populate("followedOrganizers", "organizerName category");

    res.json({ user: participant.toJSON() });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// update preferences (onboarding or profile page)
router.put("/preferences", async (req, res) => {
  try {
    const { interests, followedOrganizers, skip } = req.body;
    const update = { onboardingComplete: true };
    if (!skip) {
      if (interests) update.interests = interests;
      if (followedOrganizers) update.followedOrganizers = followedOrganizers;
    }

    const participant = await Participant.findByIdAndUpdate(
      req.user.userId,
      { $set: update },
      { new: true }
    ).populate("followedOrganizers", "organizerName category");

    res.json({ user: participant.toJSON() });
  } catch (err) {
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

// change password
router.put("/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both current and new password required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    const participant = await Participant.findById(req.user.userId);
    const match = await comparePassword(currentPassword, participant.password);
    if (!match) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    participant.password = await hashPassword(newPassword);
    await participant.save();
    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to change password" });
  }
});

export default router;

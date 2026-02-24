import { Router } from "express";
import { Organizer, Participant, Event } from "../models/index.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// list all active (non-archived, non-disabled) organizers — public for logged-in users
router.get("/", authenticate, async (req, res) => {
  try {
    const organizers = await Organizer.find(
      { isArchived: false, isDisabled: false },
      "organizerName category description contactEmail"
    ).sort({ organizerName: 1 });
    res.json({ organizers });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch organizers" });
  }
});

// single organizer detail + their events
router.get("/:id", authenticate, async (req, res) => {
  try {
    const organizer = await Organizer.findById(
      req.params.id,
      "organizerName category description contactEmail"
    );
    if (!organizer || organizer.isArchived) {
      return res.status(404).json({ error: "Organizer not found" });
    }

    const now = new Date();
    const upcoming = await Event.find({
      organizerId: organizer._id,
      status: { $in: ["published", "ongoing"] },
      endDate: { $gte: now },
    }).sort({ startDate: 1 }).select("name type startDate endDate status tags");

    const past = await Event.find({
      organizerId: organizer._id,
      status: { $in: ["completed", "closed"] },
    }).sort({ endDate: -1 }).select("name type startDate endDate status tags");

    res.json({ organizer, upcoming, past });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch organizer detail" });
  }
});

// follow an organizer
router.post("/:id/follow", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "participant") {
      return res.status(403).json({ error: "Only participants can follow organizers" });
    }

    const orgId = req.params.id;
    const org = await Organizer.findById(orgId);
    if (!org || org.isArchived) {
      return res.status(404).json({ error: "Organizer not found" });
    }

    await Participant.findByIdAndUpdate(req.user.userId, {
      $addToSet: { followedOrganizers: orgId },
    });
    res.json({ message: "Followed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to follow" });
  }
});

// unfollow an organizer
router.delete("/:id/follow", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "participant") {
      return res.status(403).json({ error: "Only participants can unfollow organizers" });
    }

    await Participant.findByIdAndUpdate(req.user.userId, {
      $pull: { followedOrganizers: req.params.id },
    });
    res.json({ message: "Unfollowed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to unfollow" });
  }
});

export default router;

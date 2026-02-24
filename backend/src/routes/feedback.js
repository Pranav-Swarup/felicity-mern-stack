import { Router } from "express";
import { Feedback, Event, Registration } from "../models/index.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

// participant submits feedback (anonymous)
router.post("/:eventId", async (req, res) => {
  try {
    if (req.user.role !== "participant") {
      return res.status(403).json({ error: "Only participants can leave feedback" });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (event.status !== "completed" && event.status !== "closed") {
      return res.status(400).json({ error: "Feedback is only available for completed events" });
    }

    // verify the participant actually attended/registered
    const reg = await Registration.findOne({
      eventId: event._id,
      participantId: req.user.userId,
      status: "confirmed",
    });
    if (!reg) {
      return res.status(403).json({ error: "You must be registered for this event to leave feedback" });
    }

    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be 1-5" });
    }

    // note: no participantId stored — feedback is anonymous
    const feedback = await Feedback.create({
      eventId: event._id,
      rating,
      comment: comment?.trim() || "",
    });

    res.status(201).json({ feedback });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

// organizer views aggregated feedback for their event
router.get("/:eventId", async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    // allow organizer who owns the event or any participant to view
    if (req.user.role === "organizer" && event.organizerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Not your event" });
    }

    const feedbacks = await Feedback.find({ eventId: event._id }).sort({ createdAt: -1 });

    const totalRatings = feedbacks.length;
    const avgRating = totalRatings > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalRatings).toFixed(1)
      : 0;

    // distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbacks.forEach((f) => { distribution[f.rating]++; });

    res.json({ feedbacks, avgRating: parseFloat(avgRating), totalRatings, distribution });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

export default router;

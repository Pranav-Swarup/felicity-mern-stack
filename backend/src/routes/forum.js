import { Router } from "express";
import { ForumMessage, Event, Registration } from "../models/index.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

// get messages for an event
router.get("/:eventId/messages", async (req, res) => {
  try {
    const messages = await ForumMessage.find({
      eventId: req.params.eventId,
      isDeleted: false,
    }).sort({ isPinned: -1, createdAt: 1 });

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// post a message
router.post("/:eventId/messages", async (req, res) => {
  try {
    const { content, parentId, isAnnouncement } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "Content is required" });

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    // participants must be registered to post
    if (req.user.role === "participant") {
      const reg = await Registration.findOne({
        eventId: event._id,
        participantId: req.user.userId,
        status: "confirmed",
      });
      if (!reg) return res.status(403).json({ error: "You must be registered to post" });
    }

    // only the organizer who owns the event can post announcements
    if (isAnnouncement && req.user.role === "organizer" && event.organizerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Not your event" });
    }

    const message = await ForumMessage.create({
      eventId: event._id,
      authorId: req.user.userId,
      authorRole: req.user.role,
      authorName: req.body.authorName || "Anonymous",
      content: content.trim(),
      parentId: parentId || null,
      isAnnouncement: isAnnouncement && req.user.role === "organizer" ? true : false,
    });

    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ error: "Failed to post message" });
  }
});

// delete a message (organizer moderation or own message)
router.delete("/messages/:id", async (req, res) => {
  try {
    const message = await ForumMessage.findById(req.params.id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    const event = await Event.findById(message.eventId);
    const isOrganizerOfEvent = req.user.role === "organizer" && event?.organizerId.toString() === req.user.userId;
    const isAuthor = message.authorId.toString() === req.user.userId;

    if (!isOrganizerOfEvent && !isAuthor) {
      return res.status(403).json({ error: "Cannot delete this message" });
    }

    message.isDeleted = true;
    await message.save();
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

// pin/unpin a message (organizer only)
router.put("/messages/:id/pin", async (req, res) => {
  try {
    const message = await ForumMessage.findById(req.params.id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    const event = await Event.findById(message.eventId);
    if (req.user.role !== "organizer" || event?.organizerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Only the event organizer can pin messages" });
    }

    message.isPinned = !message.isPinned;
    await message.save();
    res.json({ message });
  } catch (err) {
    res.status(500).json({ error: "Failed to pin" });
  }
});

// react to a message
router.put("/messages/:id/react", async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ error: "Emoji is required" });

    const message = await ForumMessage.findById(req.params.id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    const existing = message.reactions.get(emoji) || [];
    const userId = req.user.userId;

    if (existing.map(String).includes(userId)) {
      // remove reaction
      message.reactions.set(emoji, existing.filter((id) => id.toString() !== userId));
    } else {
      // add reaction
      message.reactions.set(emoji, [...existing, userId]);
    }

    await message.save();
    res.json({ message });
  } catch (err) {
    res.status(500).json({ error: "Failed to react" });
  }
});

export default router;

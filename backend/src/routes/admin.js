import { Router } from "express";
import { Organizer, Event, Registration, Participant } from "../models/index.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/role.js";
import { hashPassword } from "../utils/password.js";
import { slugifyEmail, generatePassword } from "../utils/generate.js";

const router = Router();

router.use(authenticate);
router.use(authorize("admin"));

// dashboard overview
router.get("/dashboard", async (req, res) => {
  try {
    const totalOrganizers = await Organizer.countDocuments({ isArchived: false });
    const activeOrganizers = await Organizer.countDocuments({ isArchived: false, isDisabled: false });
    const disabledOrganizers = await Organizer.countDocuments({ isDisabled: true, isArchived: false });
    const totalParticipants = await Participant.countDocuments();
    const totalEvents = await Event.countDocuments();

    res.json({
      totalOrganizers,
      activeOrganizers,
      disabledOrganizers,
      totalParticipants,
      totalEvents,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

// list all organizers (including archived for admin view)
router.get("/organizers", async (req, res) => {
  try {
    const organizers = await Organizer.find()
      .select("-password")
      .sort({ createdAt: -1 });
    res.json({ organizers });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch organizers" });
  }
});

// create new organizer
router.post("/organizers", async (req, res) => {
  try {
    const { organizerName, category, description, contactEmail, contactNumber } = req.body;

    if (!organizerName || !organizerName.trim()) {
      return res.status(400).json({ error: "Organizer name is required" });
    }

    const loginEmail = slugifyEmail(organizerName);

    // check if this email already exists
    const exists = await Organizer.findOne({ email: loginEmail });
    if (exists) {
      return res.status(409).json({ error: `An organizer with email ${loginEmail} already exists` });
    }

    const plainPassword = generatePassword();
    const hashed = await hashPassword(plainPassword);

    const organizer = await Organizer.create({
      email: loginEmail,
      password: hashed,
      organizerName: organizerName.trim(),
      category: category || "Other",
      description: description?.trim() || "",
      contactEmail: contactEmail?.trim() || "",
      contactNumber: contactNumber?.trim() || "",
    });

    // return the plain password so admin can share it with the organizer
    // this is the only time we ever return the password
    res.status(201).json({
      organizer: organizer.toJSON(),
      credentials: {
        email: loginEmail,
        password: plainPassword,
      },
    });
  } catch (err) {
    console.error("Create organizer error:", err);
    res.status(500).json({ error: "Failed to create organizer" });
  }
});

// disable organizer (block login)
router.put("/organizers/:id/disable", async (req, res) => {
  try {
    const organizer = await Organizer.findByIdAndUpdate(
      req.params.id,
      { $set: { isDisabled: true } },
      { new: true }
    );
    if (!organizer) return res.status(404).json({ error: "Organizer not found" });
    res.json({ organizer: organizer.toJSON() });
  } catch (err) {
    res.status(500).json({ error: "Failed to disable organizer" });
  }
});

// enable organizer (unblock login)
router.put("/organizers/:id/enable", async (req, res) => {
  try {
    const organizer = await Organizer.findByIdAndUpdate(
      req.params.id,
      { $set: { isDisabled: false } },
      { new: true }
    );
    if (!organizer) return res.status(404).json({ error: "Organizer not found" });
    res.json({ organizer: organizer.toJSON() });
  } catch (err) {
    res.status(500).json({ error: "Failed to enable organizer" });
  }
});

// archive organizer (soft delete)
router.put("/organizers/:id/archive", async (req, res) => {
  try {
    const organizer = await Organizer.findByIdAndUpdate(
      req.params.id,
      { $set: { isArchived: true, isDisabled: true } },
      { new: true }
    );
    if (!organizer) return res.status(404).json({ error: "Organizer not found" });
    res.json({ organizer: organizer.toJSON() });
  } catch (err) {
    res.status(500).json({ error: "Failed to archive organizer" });
  }
});

// permanent delete — cascades to events and registrations
router.delete("/organizers/:id", async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id);
    if (!organizer) return res.status(404).json({ error: "Organizer not found" });

    // find all events by this organizer
    const eventIds = await Event.find({ organizerId: organizer._id }).distinct("_id");

    // delete all registrations for those events
    if (eventIds.length > 0) {
      await Registration.deleteMany({ eventId: { $in: eventIds } });
    }

    // delete all events
    await Event.deleteMany({ organizerId: organizer._id });

    // delete the organizer
    await Organizer.findByIdAndDelete(organizer._id);

    // remove from all participants' followed lists
    await Participant.updateMany(
      { followedOrganizers: organizer._id },
      { $pull: { followedOrganizers: organizer._id } }
    );

    res.json({ message: "Organizer and all associated data deleted" });
  } catch (err) {
    console.error("Delete organizer error:", err);
    res.status(500).json({ error: "Failed to delete organizer" });
  }
});

export default router;

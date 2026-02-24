import { Router } from "express";
import { Event, Registration, Participant } from "../models/index.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/role.js";
import { generateTicketId } from "../utils/generate.js";
import { upload } from "../middleware/upload.js";
import QRCode from "qrcode";
import { sendTicketEmail } from "../services/email.js";

const router = Router();

router.use(authenticate);
router.use(authorize("participant"));

// register for a normal event
router.post("/events/:id/register", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (event.status !== "published" && event.status !== "ongoing") {
      return res.status(400).json({ error: "Registration is not open for this event" });
    }

    // check deadline
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return res.status(400).json({ error: "Registration deadline has passed" });
    }

    // check limit
    if (event.registrationLimit > 0 && event.registrationCount >= event.registrationLimit) {
      return res.status(400).json({ error: "Registration limit reached" });
    }

    // check eligibility
    const participant = await Participant.findById(req.user.userId);
    if (event.eligibility !== "all" && event.eligibility !== participant.participantType) {
      return res.status(403).json({ error: "You are not eligible for this event" });
    }

    // check if already registered
    const existing = await Registration.findOne({
      eventId: event._id,
      participantId: req.user.userId,
    });
    if (existing) {
      return res.status(409).json({ error: "Already registered for this event" });
    }

    const ticketId = generateTicketId();
    const qrData = await QRCode.toDataURL(ticketId);

    const registration = await Registration.create({
      eventId: event._id,
      participantId: req.user.userId,
      ticketId,
      qrData,
      status: "confirmed",
      formResponses: req.body.formResponses || {},
    });

    // increment registration count
    await Event.findByIdAndUpdate(event._id, { $inc: { registrationCount: 1 } });

    // lock form after first registration
    if (!event.formLocked && event.type === "normal") {
      await Event.findByIdAndUpdate(event._id, { $set: { formLocked: true } });
    }

    // send ticket email
    sendTicketEmail(participant, event, ticketId, qrData).catch((err) => {
      // console.log("Email send failed:", err.message);
    });

    res.status(201).json({ registration, ticketId, qrData });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Already registered" });
    }
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// purchase merchandise
router.post("/events/:id/purchase", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (event.type !== "merchandise") {
      return res.status(400).json({ error: "This is not a merchandise event" });
    }
    if (event.status !== "published" && event.status !== "ongoing") {
      return res.status(400).json({ error: "Purchases are not open" });
    }
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return res.status(400).json({ error: "Purchase deadline has passed" });
    }

    const { variantId, quantity = 1 } = req.body;
    if (!variantId) return res.status(400).json({ error: "Variant is required" });

    const variant = event.merchDetails?.variants?.find((v) => v.variantId === variantId);
    if (!variant) return res.status(400).json({ error: "Invalid variant" });

    if (variant.stock < quantity) {
      return res.status(400).json({ error: "Not enough stock" });
    }

    // check per-participant purchase limit
    const existingCount = await Registration.countDocuments({
      eventId: event._id,
      participantId: req.user.userId,
      status: { $in: ["confirmed", "pending"] },
    });
    const limit = event.merchDetails?.purchaseLimitPerParticipant || 1;
    if (existingCount + quantity > limit) {
      return res.status(400).json({ error: `Purchase limit is ${limit} per participant` });
    }

    const participant = await Participant.findById(req.user.userId);
    if (event.eligibility !== "all" && event.eligibility !== participant.participantType) {
      return res.status(403).json({ error: "You are not eligible" });
    }

    // merch purchases go into pending state — no ticket yet, no stock decrement
    // stock gets decremented when organizer approves the payment
    const ticketId = generateTicketId();

    const registration = await Registration.create({
      eventId: event._id,
      participantId: req.user.userId,
      ticketId,
      qrData: "",
      status: "pending",
      variantId,
      quantity,
      paymentStatus: "pending",
    });

    res.status(201).json({ registration, message: "Order placed. Please upload payment proof." });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Already purchased" });
    }
    console.error("Purchase error:", err);
    res.status(500).json({ error: "Purchase failed" });
  }
});

// upload payment proof for a merchandise order
router.post("/:regId/upload-proof", upload.single("paymentProof"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const reg = await Registration.findOne({
      _id: req.params.regId,
      participantId: req.user.userId,
    });
    if (!reg) return res.status(404).json({ error: "Order not found" });
    if (reg.paymentStatus !== "pending") {
      return res.status(400).json({ error: "Payment proof can only be uploaded for pending orders" });
    }

    reg.paymentProof = req.file.filename;
    await reg.save();

    res.json({ registration: reg, message: "Payment proof uploaded" });
  } catch (err) {
    res.status(500).json({ error: "Upload failed" });
  }
});

// get my registrations (for dashboard)
router.get("/my", async (req, res) => {
  try {
    const registrations = await Registration.find({ participantId: req.user.userId })
      .populate({
        path: "eventId",
        select: "name type status startDate endDate organizerId registrationFee",
        populate: { path: "organizerId", select: "organizerName" },
      })
      .sort({ registeredAt: -1 });

    res.json({ registrations });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch registrations" });
  }
});

// get single ticket
router.get("/ticket/:ticketId", async (req, res) => {
  try {
    const registration = await Registration.findOne({
      ticketId: req.params.ticketId,
      participantId: req.user.userId,
    }).populate({
      path: "eventId",
      select: "name type startDate endDate organizerId",
      populate: { path: "organizerId", select: "organizerName" },
    });

    if (!registration) return res.status(404).json({ error: "Ticket not found" });
    res.json({ registration });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ticket" });
  }
});

export default router;

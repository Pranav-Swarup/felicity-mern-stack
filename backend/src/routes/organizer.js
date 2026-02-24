import { Router } from "express";
import { Organizer, Event, Registration, Participant } from "../models/index.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/role.js";
import { hashPassword, comparePassword } from "../utils/password.js";

const router = Router();

router.use(authenticate);
router.use(authorize("organizer"));

// organizer profile
router.get("/profile", async (req, res) => {
  try {
    const org = await Organizer.findById(req.user.userId);
    if (!org) return res.status(404).json({ error: "Not found" });
    res.json({ user: org.toJSON() });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.put("/profile", async (req, res) => {
  try {
    const { organizerName, category, description, contactEmail, contactNumber, discordWebhookUrl } = req.body;
    const update = {};
    if (organizerName !== undefined) update.organizerName = organizerName.trim();
    if (category !== undefined) update.category = category;
    if (description !== undefined) update.description = description.trim();
    if (contactEmail !== undefined) update.contactEmail = contactEmail.trim();
    if (contactNumber !== undefined) update.contactNumber = contactNumber.trim();
    if (discordWebhookUrl !== undefined) update.discordWebhookUrl = discordWebhookUrl.trim();

    const org = await Organizer.findByIdAndUpdate(req.user.userId, { $set: update }, { new: true });
    res.json({ user: org.toJSON() });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.put("/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both passwords required" });
    }
    const org = await Organizer.findById(req.user.userId);
    const match = await comparePassword(currentPassword, org.password);
    if (!match) return res.status(401).json({ error: "Current password is incorrect" });

    org.password = await hashPassword(newPassword);
    await org.save();
    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to change password" });
  }
});

// dashboard — all events by this organizer + analytics
router.get("/dashboard", async (req, res) => {
  try {
    const orgId = req.user.userId;
    const events = await Event.find({ organizerId: orgId }).sort({ createdAt: -1 });

    // analytics for completed events
    const completedIds = events.filter((e) => e.status === "completed").map((e) => e._id);
    const regStats = await Registration.aggregate([
      { $match: { eventId: { $in: completedIds } } },
      {
        $group: {
          _id: null,
          totalRegistrations: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ["$status", "confirmed"] }, "$quantity", 0],
            },
          },
        },
      },
    ]);

    // get revenue by looking up event fees
    let totalRevenue = 0;
    for (const ev of events.filter((e) => e.status === "completed")) {
      const count = await Registration.countDocuments({ eventId: ev._id, status: "confirmed" });
      totalRevenue += count * (ev.registrationFee || 0);
    }

    res.json({
      events,
      analytics: {
        totalRegistrations: regStats[0]?.totalRegistrations || 0,
        totalRevenue,
        completedEvents: completedIds.length,
      },
    });
  } catch (err) {
    console.error("Organizer dashboard error:", err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

// create event (draft)
router.post("/events", async (req, res) => {
  try {
    const orgId = req.user.userId;
    const {
      name, description, type, eligibility,
      registrationDeadline, startDate, endDate,
      registrationLimit, registrationFee,
      tags, customForm, merchDetails,
    } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: "Event name is required" });
    if (!type) return res.status(400).json({ error: "Event type is required" });

    const event = await Event.create({
      organizerId: orgId,
      name: name.trim(),
      description: description?.trim() || "",
      type,
      eligibility: eligibility || "all",
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      registrationLimit: registrationLimit || 0,
      registrationFee: registrationFee || 0,
      tags: tags || [],
      customForm: type === "normal" ? (customForm || []) : [],
      merchDetails: type === "merchandise" ? (merchDetails || { variants: [], purchaseLimitPerParticipant: 1 }) : undefined,
      status: "draft",
    });

    res.status(201).json({ event });
  } catch (err) {
    console.error("Create event error:", err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// get single event (organizer view, with analytics)
router.get("/events/:id", async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, organizerId: req.user.userId });
    if (!event) return res.status(404).json({ error: "Event not found" });

    const registrations = await Registration.countDocuments({ eventId: event._id, status: "confirmed" });
    const revenue = registrations * (event.registrationFee || 0);

    res.json({
      event,
      analytics: { registrations, revenue },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

// edit event (respects editing rules based on status)
router.put("/events/:id", async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, organizerId: req.user.userId });
    if (!event) return res.status(404).json({ error: "Event not found" });

    const updates = req.body;

    if (event.status === "draft") {
      // draft: free edits on everything
      const allowed = [
        "name", "description", "type", "eligibility",
        "registrationDeadline", "startDate", "endDate",
        "registrationLimit", "registrationFee", "tags",
        "customForm", "merchDetails",
      ];
      for (const key of allowed) {
        if (updates[key] !== undefined) {
          if (["registrationDeadline", "startDate", "endDate"].includes(key) && updates[key]) {
            event[key] = new Date(updates[key]);
          } else {
            event[key] = updates[key];
          }
        }
      }
    } else if (event.status === "published") {
      // published: description, extend deadline, increase limit, close regs
      if (updates.description !== undefined) event.description = updates.description;
      if (updates.registrationDeadline) {
        const newDeadline = new Date(updates.registrationDeadline);
        if (newDeadline > event.registrationDeadline) {
          event.registrationDeadline = newDeadline;
        }
      }
      if (updates.registrationLimit && updates.registrationLimit > event.registrationLimit) {
        event.registrationLimit = updates.registrationLimit;
      }
    }
    // ongoing/completed: no field edits (status changes handled separately)

    await event.save();
    res.json({ event });
  } catch (err) {
    console.error("Edit event error:", err);
    res.status(500).json({ error: "Failed to update event" });
  }
});

// change event status (publish, close, complete, etc.)
router.put("/events/:id/status", async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, organizerId: req.user.userId });
    if (!event) return res.status(404).json({ error: "Event not found" });

    const { status } = req.body;
    const transitions = {
      draft: ["published"],
      published: ["ongoing", "closed"],
      ongoing: ["completed", "closed"],
    };

    const allowed = transitions[event.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: `Cannot change from "${event.status}" to "${status}". Allowed: ${allowed.join(", ") || "none"}`,
      });
    }

    // lock form on first publish if it's a normal event
    if (event.status === "draft" && status === "published" && event.type === "normal") {
      // form isn't locked yet, but it'll lock on first registration
    }

    event.status = status;
    await event.save();

    // if publishing and organizer has a discord webhook, post it
    if (status === "published") {
      const org = await Organizer.findById(req.user.userId);
      if (org?.discordWebhookUrl) {
        postToDiscord(org.discordWebhookUrl, event).catch(() => {});
      }
    }

    res.json({ event });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

// list participants for an event
router.get("/events/:id/participants", async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, organizerId: req.user.userId });
    if (!event) return res.status(404).json({ error: "Event not found" });

    const registrations = await Registration.find({ eventId: event._id })
      .populate("participantId", "firstName lastName email contactNumber college")
      .sort({ registeredAt: -1 });

    const participants = registrations.map((r) => ({
      registrationId: r._id,
      ticketId: r.ticketId,
      status: r.status,
      registeredAt: r.registeredAt,
      paymentStatus: r.paymentStatus,
      variantId: r.variantId,
      quantity: r.quantity,
      participant: r.participantId,
    }));

    res.json({ participants, total: participants.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch participants" });
  }
});

// export participants CSV
router.get("/events/:id/export-csv", async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, organizerId: req.user.userId });
    if (!event) return res.status(404).json({ error: "Event not found" });

    const registrations = await Registration.find({ eventId: event._id })
      .populate("participantId", "firstName lastName email contactNumber college");

    const rows = registrations.map((r) => ({
      "Ticket ID": r.ticketId,
      "First Name": r.participantId?.firstName || "",
      "Last Name": r.participantId?.lastName || "",
      "Email": r.participantId?.email || "",
      "Contact": r.participantId?.contactNumber || "",
      "College": r.participantId?.college || "",
      "Status": r.status,
      "Payment": r.paymentStatus,
      "Registered At": r.registeredAt?.toISOString() || "",
    }));

    // build CSV manually to avoid extra dependency complexity
    if (rows.length === 0) {
      return res.status(200).send("No registrations yet");
    }
    const headers = Object.keys(rows[0]);
    const csvLines = [headers.join(",")];
    for (const row of rows) {
      csvLines.push(headers.map((h) => `"${(row[h] || "").toString().replace(/"/g, '""')}"`).join(","));
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${event.name}-participants.csv"`);
    res.send(csvLines.join("\n"));
  } catch (err) {
    res.status(500).json({ error: "Failed to export CSV" });
  }
});

// simple discord webhook helper
async function postToDiscord(webhookUrl, event) {
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `📢 **New Event Published!**\n**${event.name}**\nType: ${event.type}\nDate: ${event.startDate?.toLocaleDateString() || "TBD"}\nFee: ${event.registrationFee ? `₹${event.registrationFee}` : "Free"}`,
      }),
    });
  } catch (err) {
    // console.log("Discord webhook failed:", err.message);
  }
}

export default router;

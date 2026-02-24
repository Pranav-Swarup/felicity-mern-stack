import { Router } from "express";
import { Event, Organizer, Registration, Participant } from "../models/index.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

// browse events with search, filters, trending
router.get("/", async (req, res) => {
  try {
    const { q, type, eligibility, dateFrom, dateTo, followedOnly, trending, page = 1, limit = 20 } = req.query;

    // only show published/ongoing events to participants
    const filter = { status: { $in: ["published", "ongoing"] } };

    // search — partial matching with regex
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const matchingOrgs = await Organizer.find({ organizerName: regex }).distinct("_id");
      filter.$or = [
        { name: regex },
        { description: regex },
        { tags: regex },
        { organizerId: { $in: matchingOrgs } },
      ];
    }

    if (type) filter.type = type;

    if (eligibility) filter.eligibility = { $in: [eligibility, "all"] };

    if (dateFrom || dateTo) {
      filter.startDate = {};
      if (dateFrom) filter.startDate.$gte = new Date(dateFrom);
      if (dateTo) filter.startDate.$lte = new Date(dateTo);
    }

    // followed clubs filter
    if (followedOnly === "true" && req.user.role === "participant") {
      const participant = await Participant.findById(req.user.userId);
      if (participant?.followedOrganizers?.length > 0) {
        filter.organizerId = { $in: participant.followedOrganizers };
      }
    }

    // trending: top 5 by registration count in last 24h
    if (trending === "true") {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const trendingPipeline = [
        { $match: { registeredAt: { $gte: oneDayAgo }, status: "confirmed" } },
        { $group: { _id: "$eventId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ];
      const trendingResults = await Registration.aggregate(trendingPipeline);
      const trendingIds = trendingResults.map((r) => r._id);

      const events = await Event.find({ _id: { $in: trendingIds }, status: { $in: ["published", "ongoing"] } })
        .populate("organizerId", "organizerName category");

      // preserve the trending order
      const eventMap = {};
      events.forEach((e) => { eventMap[e._id.toString()] = e; });
      const ordered = trendingIds.map((id) => eventMap[id.toString()]).filter(Boolean);

      return res.json({ events: ordered, total: ordered.length, trending: true });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate("organizerId", "organizerName category")
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Event.countDocuments(filter),
    ]);

    res.json({ events, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error("Browse events error:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// event detail
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizerId", "organizerName category contactEmail");

    if (!event) return res.status(404).json({ error: "Event not found" });

    // check if current participant is already registered
    let isRegistered = false;
    let registration = null;
    if (req.user.role === "participant") {
      registration = await Registration.findOne({
        eventId: event._id,
        participantId: req.user.userId,
      });
      isRegistered = !!registration;
    }

    res.json({
      event,
      isRegistered,
      registration: registration ? {
        registrationId: registration._id,
        ticketId: registration.ticketId,
        status: registration.status,
        paymentStatus: registration.paymentStatus,
        paymentProof: registration.paymentProof,
      } : null,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

export default router;

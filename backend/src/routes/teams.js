import { Router } from "express";
import { Team, Event, Registration, Participant } from "../models/index.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/role.js";
import { generateTicketId } from "../utils/generate.js";
import { sendTicketEmail } from "../services/email.js";
import QRCode from "qrcode";
import crypto from "crypto";

const router = Router();
router.use(authenticate);
router.use(authorize("participant"));

// create a team for an event
router.post("/create", async (req, res) => {
  try {
    const { eventId, teamName, maxSize } = req.body;
    if (!eventId || !teamName || !maxSize) {
      return res.status(400).json({ error: "eventId, teamName, and maxSize are required" });
    }
    if (maxSize < 2 || maxSize > 20) {
      return res.status(400).json({ error: "Team size must be 2-20" });
    }

    const event = await Event.findById(eventId);
    if (!event || (event.status !== "published" && event.status !== "ongoing")) {
      return res.status(400).json({ error: "Event not open for registration" });
    }

    // check if participant already has a team for this event
    const existing = await Team.findOne({
      eventId,
      "members.participantId": req.user.userId,
    });
    if (existing) {
      return res.status(409).json({ error: "You already have a team for this event" });
    }

    const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    const team = await Team.create({
      eventId,
      teamName: teamName.trim(),
      leaderId: req.user.userId,
      maxSize,
      inviteCode,
      members: [
        { participantId: req.user.userId, status: "accepted", joinedAt: new Date() },
      ],
    });

    res.status(201).json({ team });
  } catch (err) {
    console.error("Create team error:", err);
    res.status(500).json({ error: "Failed to create team" });
  }
});

// join a team via invite code
router.post("/join", async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ error: "Invite code is required" });

    const team = await Team.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!team) return res.status(404).json({ error: "Invalid invite code" });
    if (team.isComplete) return res.status(400).json({ error: "Team is already full" });

    // check if already a member
    const isMember = team.members.some(
      (m) => m.participantId.toString() === req.user.userId
    );
    if (isMember) return res.status(409).json({ error: "Already in this team" });

    // check if participant already has a different team for this event
    const otherTeam = await Team.findOne({
      eventId: team.eventId,
      "members.participantId": req.user.userId,
    });
    if (otherTeam) return res.status(409).json({ error: "You already have a team for this event" });

    team.members.push({
      participantId: req.user.userId,
      status: "accepted",
      joinedAt: new Date(),
    });

    // check if team is now complete
    const acceptedCount = team.members.filter((m) => m.status === "accepted").length;
    if (acceptedCount >= team.maxSize) {
      team.isComplete = true;
      // generate tickets for all members
      await generateTeamTickets(team);
    }

    await team.save();
    res.json({ team });
  } catch (err) {
    console.error("Join team error:", err);
    res.status(500).json({ error: "Failed to join team" });
  }
});

// get my teams
router.get("/my", async (req, res) => {
  try {
    const teams = await Team.find({ "members.participantId": req.user.userId })
      .populate("eventId", "name type startDate status")
      .populate("members.participantId", "firstName lastName email")
      .sort({ createdAt: -1 });
    res.json({ teams });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

// get single team
router.get("/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("eventId", "name type startDate status")
      .populate("leaderId", "firstName lastName email")
      .populate("members.participantId", "firstName lastName email");
    if (!team) return res.status(404).json({ error: "Team not found" });
    res.json({ team });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch team" });
  }
});

async function generateTeamTickets(team) {
  const event = await Event.findById(team.eventId);
  if (!event) return;

  for (const member of team.members) {
    if (member.status !== "accepted") continue;

    // skip if already has a registration
    const existing = await Registration.findOne({
      eventId: team.eventId,
      participantId: member.participantId,
    });
    if (existing) continue;

    const ticketId = generateTicketId();
    const qrData = await QRCode.toDataURL(ticketId);

    await Registration.create({
      eventId: team.eventId,
      participantId: member.participantId,
      ticketId,
      qrData,
      status: "confirmed",
      teamId: team._id,
    });

    await Event.findByIdAndUpdate(team.eventId, { $inc: { registrationCount: 1 } });

    const participant = await Participant.findById(member.participantId);
    if (participant) {
      sendTicketEmail(participant, event, ticketId, qrData).catch(() => {});
    }
  }
}

export default router;

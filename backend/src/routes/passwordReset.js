import { Router } from "express";
import { PasswordResetRequest, Organizer } from "../models/index.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/role.js";
import { hashPassword } from "../utils/password.js";
import { generatePassword } from "../utils/generate.js";

const router = Router();
router.use(authenticate);

// organizer: submit a password reset request
router.post("/request", authorize("organizer"), async (req, res) => {
  try {
    const pending = await PasswordResetRequest.findOne({
      organizerId: req.user.userId,
      status: "pending",
    });
    if (pending) {
      return res.status(409).json({ error: "You already have a pending request" });
    }

    const request = await PasswordResetRequest.create({
      organizerId: req.user.userId,
      reason: req.body.reason || "",
    });
    res.status(201).json({ request });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit request" });
  }
});

// organizer: view own requests
router.get("/my", authorize("organizer"), async (req, res) => {
  try {
    const requests = await PasswordResetRequest.find({ organizerId: req.user.userId })
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// admin: list all requests
router.get("/all", authorize("admin"), async (req, res) => {
  try {
    const requests = await PasswordResetRequest.find()
      .populate("organizerId", "organizerName email")
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// admin: approve
router.put("/:id/approve", authorize("admin"), async (req, res) => {
  try {
    const request = await PasswordResetRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.status !== "pending") {
      return res.status(400).json({ error: "Request already resolved" });
    }

    const plainPassword = generatePassword();
    const hashed = await hashPassword(plainPassword);

    await Organizer.findByIdAndUpdate(request.organizerId, { password: hashed });

    request.status = "approved";
    request.adminComment = req.body.comment || "";
    request.newPassword = plainPassword;
    request.resolvedAt = new Date();
    await request.save();

    res.json({ request, newPassword: plainPassword });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve" });
  }
});

// admin: reject
router.put("/:id/reject", authorize("admin"), async (req, res) => {
  try {
    const request = await PasswordResetRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.status !== "pending") {
      return res.status(400).json({ error: "Request already resolved" });
    }

    request.status = "rejected";
    request.adminComment = req.body.comment || "";
    request.resolvedAt = new Date();
    await request.save();

    res.json({ request });
  } catch (err) {
    res.status(500).json({ error: "Failed to reject" });
  }
});

export default router;

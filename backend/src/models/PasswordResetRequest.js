import mongoose from "mongoose";

const passwordResetRequestSchema = new mongoose.Schema({
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organizer",
    required: true,
  },
  reason: { type: String, default: "" },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  adminComment: { type: String, default: "" },
  newPassword: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date, default: null },
});

export default mongoose.model("PasswordResetRequest", passwordResetRequestSchema);

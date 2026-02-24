import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Participant",
    required: true,
  },
  ticketId: { type: String, unique: true, required: true },
  qrData: { type: String, default: "" },
  status: {
    type: String,
    enum: ["confirmed", "pending", "cancelled", "rejected"],
    default: "confirmed",
  },

  // normal event form responses
  formResponses: { type: mongoose.Schema.Types.Mixed, default: {} },

  // merchandise specific
  variantId: { type: String, default: null },
  quantity: { type: Number, default: 1 },
  paymentProof: { type: String, default: null },
  paymentStatus: {
    type: String,
    enum: ["na", "pending", "approved", "rejected"],
    default: "na",
  },

  // team ref (for hackathon events)
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    default: null,
  },

  registeredAt: { type: Date, default: Date.now },
});

// one registration per participant per event (for normal events)
registrationSchema.index({ eventId: 1, participantId: 1 }, { unique: true });

export default mongoose.model("Registration", registrationSchema);

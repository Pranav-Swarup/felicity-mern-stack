import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  teamName: { type: String, required: true, trim: true },
  leaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Participant",
    required: true,
  },
  maxSize: { type: Number, required: true, min: 2 },
  inviteCode: { type: String, unique: true, required: true },
  members: [
    {
      participantId: { type: mongoose.Schema.Types.ObjectId, ref: "Participant" },
      status: { type: String, enum: ["accepted", "pending"], default: "pending" },
      joinedAt: { type: Date },
      _id: false,
    },
  ],
  isComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Team", teamSchema);

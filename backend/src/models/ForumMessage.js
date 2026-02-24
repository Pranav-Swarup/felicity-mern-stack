import mongoose from "mongoose";

const forumMessageSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  authorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  authorRole: { type: String, enum: ["participant", "organizer"], required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: "ForumMessage", default: null },
  isPinned: { type: Boolean, default: false },
  isAnnouncement: { type: Boolean, default: false },
  reactions: { type: Map, of: [mongoose.Schema.Types.ObjectId], default: {} },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("ForumMessage", forumMessageSchema);

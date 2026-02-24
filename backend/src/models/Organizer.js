import mongoose from "mongoose";

const organizerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true },
  organizerName: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ["Technical", "Cultural", "Sports", "Literary", "Social", "Other"],
    default: "Other",
  },
  description: { type: String, default: "" },
  contactEmail: { type: String, default: "" },
  contactNumber: { type: String, default: "" },
  discordWebhookUrl: { type: String, default: "" },
  isDisabled: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

organizerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model("Organizer", organizerSchema);

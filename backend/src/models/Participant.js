import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  participantType: {
    type: String,
    enum: ["iiit", "non-iiit"],
    required: true,
  },
  college: { type: String, default: "" },
  contactNumber: { type: String, default: "" },
  interests: [{ type: String }],
  followedOrganizers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Organizer" }],
  onboardingComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// don't return password in JSON
participantSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model("Participant", participantSchema);

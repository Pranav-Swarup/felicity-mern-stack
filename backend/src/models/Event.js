import mongoose from "mongoose";

const formFieldSchema = new mongoose.Schema(
  {
    fieldId: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "textarea", "number", "dropdown", "checkbox", "file"],
      required: true,
    },
    options: [String],
    required: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const merchVariantSchema = new mongoose.Schema(
  {
    variantId: { type: String, required: true },
    label: { type: String, default: "" },
    size: { type: String, default: "" },
    color: { type: String, default: "" },
    stock: { type: Number, default: 0 },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema({
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organizer",
    required: true,
  },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  type: {
    type: String,
    enum: ["normal", "merchandise"],
    required: true,
  },
  eligibility: {
    type: String,
    enum: ["all", "iiit", "non-iiit"],
    default: "all",
  },
  registrationDeadline: { type: Date },
  startDate: { type: Date },
  endDate: { type: Date },
  registrationLimit: { type: Number, default: 0 },
  registrationFee: { type: Number, default: 0 },
  registrationCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["draft", "published", "ongoing", "completed", "closed"],
    default: "draft",
  },
  tags: [{ type: String }],

  // normal events — custom registration form
  customForm: [formFieldSchema],
  formLocked: { type: Boolean, default: false },

  // merchandise events
  merchDetails: {
    variants: [merchVariantSchema],
    purchaseLimitPerParticipant: { type: Number, default: 1 },
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

eventSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// text index for search
eventSchema.index({ name: "text", description: "text", tags: "text" });

export default mongoose.model("Event", eventSchema);

import { Schema, model, Types } from "mongoose";

const ProgressSchema = new Schema(
  {
    userId: { type: String, required: true },                 
    materialId: { type: Types.ObjectId, ref: "Material", required: true },
    status: {
      type: String,
      enum: ["not-started", "in-progress", "completed"],
      default: "in-progress",
    },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    lastVisitedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ProgressSchema.index({ userId: 1, materialId: 1 }, { unique: true });

export const ProgressModel = model("Progress", ProgressSchema);

import { Schema, model } from "mongoose";

const LessonLinkSchema = new Schema(
  {
    room: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    participants: { type: [String], default: [] }, 
    createdBy: { type: String, default: "" },      
    expiresAt: { type: Date },                     
  },
  { timestamps: true }
);

LessonLinkSchema.index({ createdAt: -1 });
LessonLinkSchema.index({ room: 1 }, { unique: true });

export const LessonLinkModel = model("LessonLink", LessonLinkSchema);

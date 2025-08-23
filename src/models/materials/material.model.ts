import { Schema, model } from "mongoose";

const SectionSchema = new Schema(
  {
    heading: { type: String, required: true },
    content: { type: String, required: true }, 
    examples: [{ type: String }],
  },
  { _id: false }
);

const MaterialSchema = new Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["grammar", "vocabulary", "other"], required: true },
    slug: { type: String, required: true },
    kind: { type: String, enum: ["lesson", "exercise", "quiz"], default: "lesson" },
    order: { type: Number, default: 1 },
    sections: { type: [SectionSchema], default: [] },
    tags: { type: [String], default: [] },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MaterialSchema.index({ type: 1, slug: 1 }, { unique: true });

export const MaterialModel = model("Material", MaterialSchema);

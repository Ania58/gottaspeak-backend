import { Schema, model, Types } from "mongoose";

const NoteSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },

    materialId: { type: Types.ObjectId, ref: "Material", index: true },

    content: { type: String, required: true }, 
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const NoteModel = model("Note", NoteSchema);

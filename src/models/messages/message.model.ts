import { Schema, model } from "mongoose";

const MessageSchema = new Schema(
  {
    userId: { type: String, required: true, index: true }, 
    text:   { type: String, required: true },
    direction: { type: String, enum: ["fromUser", "fromTeacher"], default: "fromUser" },
  },
  { timestamps: true }
);

MessageSchema.index({ userId: 1, createdAt: -1 });
MessageSchema.index({ userId: 1, createdAt:  1 });

export const MessageModel = model("Message", MessageSchema);

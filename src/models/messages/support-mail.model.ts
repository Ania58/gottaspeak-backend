import { Schema, model } from "mongoose";

const SupportMailSchema = new Schema(
  {
    direction: { type: String, enum: ["outgoing", "incoming"], required: true },
    to:        { type: [String], default: [] },
    from:      { type: String, default: "" },
    subject:   { type: String, default: "" },
    text:      { type: String, default: "" },
    html:      { type: String, default: "" },
    userId:    { type: String },          
    provider:  { type: String, default: "brevo" },
    status:    { type: String, enum: ["queued", "sent", "failed"], default: "queued" },
    error:     { type: String, default: "" },
    meta:      { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

SupportMailSchema.index({ createdAt: -1 });

export const SupportMailModel = model("SupportMail", SupportMailSchema);

import { Schema, model } from "mongoose";

const ConfigSchema = new Schema(
  {
    _id: { type: String, default: "site" },
    sayrightUrl: { type: String, default: "https://sayright.gottaspeak.com" },
    lessonJoinUrl: { type: String, default: "https://meet.jit.si" }, 
    supportEmail: { type: String, default: "" },
    languages: { type: [String], default: ["pl", "en", "es"] },
  },
  { timestamps: true }
);

export const ConfigModel = model("Config", ConfigSchema);

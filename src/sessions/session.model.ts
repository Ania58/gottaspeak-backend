import { Schema, model, Types } from "mongoose";

export type ParticipantRole = "teacher" | "student";

export interface SessionParticipant {
  userId?: string;              
  displayName: string;
  role: ParticipantRole;
}

export interface SessionDoc {
  _id: Types.ObjectId;
  room: string;                
  courseLevel: string;           
  unit: number;                  
  lesson: number;               
  participants: SessionParticipant[];
  createdBy: string;             
  startsAt?: Date;              
  expiresAt?: Date;              
}

const ParticipantSchema = new Schema<SessionParticipant>(
  {
    userId: { type: String },
    displayName: { type: String, required: true },
    role: { type: String, enum: ["teacher", "student"], required: true },
  },
  { _id: false }
);

const SessionSchema = new Schema<SessionDoc>(
  {
    room: { type: String, required: true, unique: true },         
    courseLevel: { type: String, required: true },
    unit: { type: Number, required: true },
    lesson: { type: Number, required: true },
    participants: { type: [ParticipantSchema], default: [] },
    createdBy: { type: String, default: "" },
    startsAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

SessionSchema.index({ "participants.userId": 1, startsAt: -1 });
SessionSchema.index({ createdAt: -1 });

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SessionModel = model<SessionDoc>("Session", SessionSchema);

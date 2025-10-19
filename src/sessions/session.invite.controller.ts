import type { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { SessionModel } from "./session.model";

const inviteSchema = z.object({
  sessionId: z.string(),
  userId: z.string().optional(),
  displayName: z.string().optional().default("Guest"),
  role: z.enum(["teacher", "student"]),
  ttlMinutes: z.coerce.number().int().min(5).max(7 * 24 * 60).optional(),
});

const JWT_SECRET = process.env.SESSION_JWT_SECRET || "dev-secret";

export async function createInviteLink(req: Request, res: Response) {
  try {
    const parsed = inviteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    }
    const { sessionId, userId, displayName, role, ttlMinutes } = parsed.data;

    if (!isValidObjectId(sessionId)) {
      return res.status(400).json({ error: "Invalid sessionId: must be a Mongo ObjectId" });
    }

    const session = await SessionModel.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const ttl = ttlMinutes ?? 24 * 60;
    const exp = Math.floor(Date.now() / 1000) + ttl * 60;

    const token = jwt.sign({ sessionId, userId, displayName, role, exp }, JWT_SECRET);

    const base = process.env.FRONTEND_URL?.replace(/\/+$/, "") || "http://localhost:5173";
    const link = `${base}/live/${sessionId}?t=${token}`;

    return res.status(201).json({ sessionId, token, link, expiresInMinutes: ttl });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

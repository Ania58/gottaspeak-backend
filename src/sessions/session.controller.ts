import type { Request, Response } from "express";
import { z } from "zod";
import { SessionModel } from "./session.model";

const createSessionSchema = z.object({
  courseLevel: z.string(),
  unit: z.number().int().positive(),
  lesson: z.number().int().positive(),
  teacherId: z.string().optional(),
  displayName: z.string().optional().default("Teacher"),
  ttlMinutes: z.coerce.number().int().min(5).max(7 * 24 * 60).optional(),
});

function generateRoomId(): string {
  return `gs-sess-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

export async function createSession(req: Request, res: Response) {
  try {
    const parsed = createSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    }

    const { courseLevel, unit, lesson, teacherId, displayName, ttlMinutes } = parsed.data;

    const room = generateRoomId();
    const ttl = ttlMinutes ?? 24 * 60; 
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

    const session = await SessionModel.create({
      room,
      courseLevel,
      unit,
      lesson,
      participants: [
        { userId: teacherId, displayName, role: "teacher" },
      ].filter((p) => !!p.userId),
      createdBy: teacherId || "",
      expiresAt,
    });

    res.status(201).json({
      id: session._id,
      room: session.room,
      courseLevel,
      unit,
      lesson,
      expiresAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server error" });
  }
}

export async function getSession(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const session = await SessionModel.findById(id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server error" });
  }
}

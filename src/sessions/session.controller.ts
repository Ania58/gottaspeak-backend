import type { Request, Response } from "express";
import { z } from "zod";
import { SessionModel } from "./session.model";

const participantSchema = z.object({
  userId: z.string().optional(),
  displayName: z.string().min(1),
  role: z.enum(["teacher", "student"]),
});

const createSessionSchema = z.object({
  courseLevel: z.string(),
  unit: z.number().int().positive(),
  lesson: z.number().int().positive(),
  teacherId: z.string().optional(),
  displayName: z.string().optional().default("Teacher"),
  studentIds: z.array(z.string()).optional(),
  participants: z.array(participantSchema).optional(),
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

    const {
      courseLevel,
      unit,
      lesson,
      teacherId,
      displayName,
      studentIds,
      participants,
      ttlMinutes,
    } = parsed.data;

    const builtParticipants =
      (participants && participants.length > 0
        ? participants
        : [
            teacherId
              ? { userId: teacherId, displayName: displayName || "Teacher", role: "teacher" as const }
              : undefined,
            ...(studentIds || []).map((sid, i) => ({
              userId: sid,
              displayName: `Student ${i + 1}`,
              role: "student" as const,
            })),
          ].filter(Boolean)) as Array<z.infer<typeof participantSchema>>;

    const room = generateRoomId();
    const ttl = ttlMinutes ?? 24 * 60;
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

    const session = await SessionModel.create({
      room,
      courseLevel,
      unit,
      lesson,
      participants: builtParticipants,
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
      participants: session.participants,
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


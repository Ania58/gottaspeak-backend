import type { Request, Response } from "express";
import { SessionModel } from "./session.model";

export async function listSessions(req: Request, res: Response) {
  try {
    const userId = String(req.query.userId || "").trim();
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const sessions = await SessionModel.find({
      "participants.userId": userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(
      sessions.map((s) => ({
        id: s._id,
        room: s.room,
        courseLevel: s.courseLevel,
        unit: s.unit,
        lesson: s.lesson,
        expiresAt: s.expiresAt ?? null,
      }))
    );
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server error" });
  }
}

import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { SessionModel } from "./session.model";
import { ConfigModel } from "../models/config/config.model";

const joinAuthSchema = z.object({
  userId: z.string().optional(),
  displayName: z.string().optional().default("Guest"),
  role: z.enum(["teacher", "student"]).optional().default("student"),
});


export async function joinSessionAuthenticated(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid session id" });
    }

    const parse = joinAuthSchema.safeParse(req.body || {});
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0]?.message || "Bad request" });
    }
    const { userId, displayName, role } = parse.data;

    const session = await SessionModel.findById(id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const base =
      (await ConfigModel.findById("site"))?.lessonJoinUrl || "https://meet.jit.si";
    const baseTrimmed = base.replace(/\/+$/, "");

    const callUrl = `${baseTrimmed}/${session.room}#userInfo.displayName=${encodeURIComponent(
      displayName || "Guest"
    )}`;

    return res.json({
      url: callUrl,
      session: {
        id: session._id,
        room: session.room,
        courseLevel: session.courseLevel,
        unit: session.unit,
        lesson: session.lesson,
        expiresAt: session.expiresAt ?? null,
      },
      me: {
        role,
        displayName: displayName || "Guest",
        userId: userId || null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}

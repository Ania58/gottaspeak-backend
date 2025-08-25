import type { Request, Response } from "express";
import { z } from "zod";
import { LessonLinkModel } from "./lesson-link.model";
import { ConfigModel } from "../models/config/config.model";

const createSchema = z.object({
  teacherId: z.string().optional(),
  studentId: z.string().optional(),
  displayName: z.string().optional().default("Guest"),
  ttlMinutes: z.coerce.number().int().min(5).max(7 * 24 * 60).optional(), 
});

function randomRoom(): string {
  return `gs-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

export async function createLessonLink(req: Request, res: Response) {
  const token = req.header("x-admin-token");
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message });
  }
  const { teacherId, studentId, displayName, ttlMinutes } = parsed.data;

  const base = (await ConfigModel.findById("site"))?.lessonJoinUrl || "https://meet.jit.si";
  const baseTrimmed = base.replace(/\/+$/, "");

  const room = randomRoom();
  const url = `${baseTrimmed}/${room}#userInfo.displayName=${encodeURIComponent(displayName)}`;

  const ttl = (ttlMinutes ?? 24 * 60); 
  const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

  const doc = await LessonLinkModel.create({
    room,
    url,
    participants: [teacherId, studentId].filter(Boolean) as string[],
    createdBy: teacherId || "",
    expiresAt,
  });

  return res.status(201).json({
    room: doc.room,
    url: doc.url,
    expiresAt: doc.expiresAt,
  });
}

export async function getLessonLink(req: Request, res: Response) {
  const room = String(req.params.room || "");
  const doc = await LessonLinkModel.findOne({ room });
  if (!doc) return res.status(404).json({ error: "Not found" });
  return res.json({ room: doc.room, url: doc.url, expiresAt: doc.expiresAt || null });
}

import type { Request, Response } from "express";
import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { ProgressModel } from "./progress.model";

const objectId = z.string().refine(isValidObjectId, "Invalid ObjectId");

const listQuery = z.object({
  userId: z.string().min(1),
  materialId: z.string().optional(),
  status: z.enum(["not-started", "in-progress", "completed"]).optional(),
});

export async function listProgress(req: Request, res: Response) {
  const q = listQuery.safeParse(req.query);
  if (!q.success) return res.status(400).json({ error: q.error.issues[0]?.message });

  const filter: any = { userId: q.data.userId };
  if (q.data.materialId) {
    if (!isValidObjectId(q.data.materialId)) return res.status(400).json({ error: "Invalid ObjectId" });
    filter.materialId = q.data.materialId;
  }
  if (q.data.status) filter.status = q.data.status;

  const items = await ProgressModel.find(filter).sort({ updatedAt: -1 }).limit(200);
  res.json(items);
}

const upsertBody = z.object({
  userId: z.string().min(1),
  materialId: objectId,
  status: z.enum(["not-started", "in-progress", "completed"]).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
});

export async function upsertProgress(req: Request, res: Response) {
  const parsed = upsertBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });

  const { userId, materialId, status, difficulty } = parsed.data;

  const updated = await ProgressModel.findOneAndUpdate(
    { userId, materialId },
    { $set: { ...(status && { status }), ...(difficulty && { difficulty }), lastVisitedAt: new Date() } },
    { new: true, upsert: true }
  );

  res.json(updated);
}

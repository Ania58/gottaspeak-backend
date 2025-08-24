import type { Request, Response } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import { NoteModel } from "./note.model";

function isAdmin(req: Request) {
  return req.header("x-admin-token") === process.env.ADMIN_TOKEN;
}

const createSchema = z.object({
  userId: z.string().min(1),
  materialId: z.string().length(24).optional(), 
  content: z.string().min(1),
  isPinned: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

export async function listNotes(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter: any = {};
  const { userId, materialId } = req.query as { userId?: string; materialId?: string };

  if (!isAdmin(req) && !userId) {
    return res.status(400).json({ error: "userId is required for non-admin requests" });
  }
  if (userId) filter.userId = userId;
  if (materialId && /^[a-f0-9]{24}$/i.test(materialId)) {
    filter.materialId = new Types.ObjectId(materialId);
  }

  const [items, total] = await Promise.all([
    NoteModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    NoteModel.countDocuments(filter),
  ]);

  res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function createNote(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid data" });
  }
  const data = parsed.data;

  const doc = await NoteModel.create({
    userId: data.userId,
    content: data.content,
    isPinned: data.isPinned ?? false,
    materialId: data.materialId ? new Types.ObjectId(data.materialId) : undefined,
  });

  res.status(201).json(doc);
}

export async function updateNoteById(req: Request, res: Response) {
  const { id } = req.params;
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid data" });
  }

  const data = parsed.data;
  const $set: any = { ...data };
  if (data.materialId) $set.materialId = new Types.ObjectId(data.materialId);

  const updated = await NoteModel.findByIdAndUpdate(id, { $set }, { new: true });
  if (!updated) return res.status(404).json({ error: "Note not found" });
  res.json(updated);
}

export async function deleteNoteById(req: Request, res: Response) {
  const { id } = req.params;
  const deleted = await NoteModel.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "Note not found" });
  res.json({ ok: true });
}

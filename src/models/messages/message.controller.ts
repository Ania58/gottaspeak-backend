import type { Request, Response } from "express";
import { z } from "zod";
import { MessageModel } from "./message.model";

const listQuery = z.object({
  userId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export async function listMessages(req: Request, res: Response) {
  const q = listQuery.safeParse(req.query);
  if (!q.success) return res.status(400).json({ error: q.error.issues[0]?.message });

  const { userId, limit = 50 } = q.data;
  const items = await MessageModel.find({ userId }).sort({ createdAt: 1 }).limit(limit);
  res.json(items);
}

const postBody = z.object({
  userId: z.string().min(1),
  text: z.string().min(1).max(4000),
});

export async function createMessage(req: Request, res: Response) {
  const parsed = postBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });

  const created = await MessageModel.create({
    userId: parsed.data.userId,
    text: parsed.data.text,
  });

  res.status(201).json(created);
}

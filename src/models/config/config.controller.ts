import type { Request, Response } from "express";
import { z } from "zod";
import { ConfigModel } from "./config.model";

const updateSchema = z.object({
  sayrightUrl: z.string().url().optional(),
  lessonJoinUrl: z.string().url().optional(),
  supportEmail: z.string().email().optional(),
  languages: z.array(z.string()).min(1).optional(),
});

export async function getPublicConfig(_req: Request, res: Response) {
  const cfg = await ConfigModel.findById("site");
  res.json({
    sayrightUrl: cfg?.sayrightUrl ?? "https://sayright.gottaspeak.com",
    lessonJoinUrl: cfg?.lessonJoinUrl ?? "https://meet.jit.si",
    languages: cfg?.languages ?? ["pl", "en", "es"],
  });
}

export async function updateConfig(req: Request, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid data" });
  }

  const updated = await ConfigModel.findByIdAndUpdate(
    "site",
    { $set: parsed.data },
    { upsert: true, new: true }
  );

  res.json(updated);
}

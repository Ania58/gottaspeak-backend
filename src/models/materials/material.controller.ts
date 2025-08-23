import type { Request, Response } from "express";
import { z } from "zod";
import { MaterialModel } from "./material.model";

const createMaterialSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["grammar", "vocabulary", "other"]),
  slug: z.string().min(1).optional(),
  kind: z.enum(["lesson", "exercise", "quiz"]).optional(),
  order: z.number().int().positive().optional(),
  sections: z.array(z.object({
    heading: z.string().min(1),
    content: z.string().min(1),
    examples: z.array(z.string()).optional()
  })).optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional()
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^a-z0-9\s-]/g, "")                    
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function ensureUniqueSlug(type: string, baseSlug: string) {
  let slug = baseSlug;
  let i = 2;
  while (await MaterialModel.exists({ type, slug })) {
    slug = `${baseSlug}-${i}`;
    i++;
  }
  return slug;
}

export async function listMaterials(req: Request, res: Response) {
  const { type, search } = req.query as { type?: string; search?: string };
  const filter: any = {};
  if (type) filter.type = type;
  if (search) filter.title = { $regex: search, $options: "i" };

  const items = await MaterialModel.find(filter).sort({ createdAt: -1 }).limit(100);
  res.json(items);
}

export async function getMaterialByTypeSlug(req: Request, res: Response) {
  const { type, slug } = req.params;
  const doc = await MaterialModel.findOne({ type, slug });
  if (!doc) return res.status(404).json({ error: "Material not found" });
  res.json(doc);
}

export async function createMaterial(req: Request, res: Response) {
  const parsed = createMaterialSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid data" });
  }

  const data = parsed.data;
  const baseSlug = data.slug ? slugify(data.slug) : slugify(data.title);
  const finalSlug = await ensureUniqueSlug(data.type, baseSlug);

  const created = await MaterialModel.create({
    ...data,
    slug: finalSlug
  });

  res.status(201).json(created);
}

export function updateMaterial(_req: Request, res: Response) {
  return res.status(501).json({ error: "Not implemented yet" });
}
export function deleteMaterial(_req: Request, res: Response) {
  return res.status(501).json({ error: "Not implemented yet" });
}

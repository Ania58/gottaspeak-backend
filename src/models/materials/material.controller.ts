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

const updateMaterialSchema = createMaterialSchema.partial();

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

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const allowedSort = new Set(["createdAt", "updatedAt", "order", "title"]);
  const sortBy = (req.query.sortBy as string) && allowedSort.has(String(req.query.sortBy))
    ? String(req.query.sortBy)
    : "createdAt";
  const sortDir = String(req.query.sortDir || "desc").toLowerCase() === "asc" ? 1 : -1;
  const sort: Record<string, 1 | -1> = { [sortBy]: sortDir as 1 | -1 };

  const filter: any = {};
  if (type) filter.type = type;
  if (search) filter.title = { $regex: search, $options: "i" };

  const [items, total] = await Promise.all([
    MaterialModel.find(filter).sort(sort).skip(skip).limit(limit),
    MaterialModel.countDocuments(filter),
  ]);

  res.json(
    {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      sortBy,
      sortDir: sortDir === 1 ? "asc" : "desc",
    }
  );
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

export async function updateMaterialById(req: Request, res: Response) {
  const { id } = req.params;
  const parsed = updateMaterialSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid data" });

  const data = parsed.data;
  const $set: any = { ...data };
  if (typeof data.slug === "string") $set.slug = slugify(data.slug);

  try {
    const updated = await MaterialModel.findByIdAndUpdate(id, { $set }, { new: true });
    if (!updated) return res.status(404).json({ error: "Material not found" });
    res.json(updated);
  } catch (err: any) {
    if (err?.code === 11000) return res.status(409).json({ error: "Slug already exists for this type" });
    throw err;
  }
}

export async function deleteMaterialById(req: Request, res: Response) {
  const { id } = req.params;
  const deleted = await MaterialModel.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "Material not found" });
  res.json({ ok: true });
}


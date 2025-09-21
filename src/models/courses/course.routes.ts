import { Router } from "express";
import matter from "gray-matter";
import { fetch as undiciFetch } from "undici";

const router = Router();

const CDN_BASE = (process.env.COURSES_CDN_BASE || "").replace(/\/+$/, "");

const cache = new Map<string, { body: string; t: number }>();
const TTL = 60_000;

function getCached(url: string) {
  const hit = cache.get(url);
  return hit && Date.now() - hit.t < TTL ? hit.body : null;
}
function setCached(url: string, body: string) {
  cache.set(url, { body, t: Date.now() });
}

async function fetchText(url: string) {
  const c = getCached(url);
  if (c) return c;
  const r = await undiciFetch(url);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} :: ${url}`);
  const txt = await r.text();
  setCached(url, txt);
  return txt;
}


router.get("/:level", async (req, res) => {
  try {
    const { level } = req.params;
    const url = `${CDN_BASE}/${level}/units.json`;
    const raw = await fetchText(url);
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) throw new Error("Invalid units.json");
    res.json(list);
  } catch (e: any) {
    res.status(404).json({ error: "Course listing not available", details: e?.message });
  }
});


router.get("/:level/units/:unit", async (req, res) => {
  try {
    const { level, unit } = req.params;
    const unitId = String(unit).padStart(2, "0");
    const url = `${CDN_BASE}/${level}/unit-${unitId}/lessons.json`;
    const raw = await fetchText(url);
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return res.json(data);
    if (Array.isArray(data?.lessons)) return res.json(data.lessons);
    throw new Error("Invalid lessons.json");
  } catch (e: any) {
    res.status(404).json({ error: "Unit listing not available", details: e?.message });
  }
});


router.get("/:level/units/:unit/lessons/:lesson", async (req, res) => {
  try {
    const { level, unit, lesson } = req.params;
    const unitId = String(unit).padStart(2, "0");
    const lesId = String(lesson).padStart(2, "0");
    const url = `${CDN_BASE}/${level}/unit-${unitId}/lesson-${lesId}.md`;
    const md = await fetchText(url);
    const { data, content } = matter(md);
    const steps = content.split(/\n-{3,}\n/g);
    res.json({ meta: data, steps });
  } catch (e: any) {
    res.status(404).json({ error: "Lesson not found", details: e?.message });
  }
});

export default router;


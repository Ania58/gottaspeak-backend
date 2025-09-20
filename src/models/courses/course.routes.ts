import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { fetch as undiciFetch } from "undici";

const router = Router();

const SRC = (process.env.COURSES_SOURCE || "local").toLowerCase() as "github" | "local";

const GH = {
  owner: process.env.COURSES_GITHUB_OWNER || "",
  repo: process.env.COURSES_GITHUB_REPO || "",
  branch: process.env.COURSES_GITHUB_BRANCH || "main",
  dir: (process.env.COURSES_GITHUB_DIR || "courses").replace(/^\/+|\/+$/g, ""),
  token: process.env.COURSES_GITHUB_TOKEN || "",
};

const LOCAL_DIR = process.env.COURSES_DIR || path.join(process.cwd(), "content", "courses");

const pad2 = (n: string | number) => String(n).padStart(2, "0");
const toPosix = (p: string) => p.replace(/\\/g, "/");

const cache = new Map<string, { body: string; t: number }>();
const TTL_MS = 60_000;

function getCache(key: string) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < TTL_MS) return hit.body;
  return null;
}
function setCache(key: string, body: string) {
  cache.set(key, { body, t: Date.now() });
}

async function fetchGithubRaw(relPath: string): Promise<string> {
  const base = `https://raw.githubusercontent.com/${GH.owner}/${GH.repo}/${GH.branch}`;
  const url = `${base}/${relPath.replace(/^\/+/, "")}`;
  const cached = getCache(url);
  if (cached) return cached;
  const res = await undiciFetch(url, {
    headers: GH.token ? { Authorization: `token ${GH.token}` } : undefined,
  } as any);
  if (!res.ok) throw new Error(`GitHub RAW ${res.status} ${res.statusText}`);
  const text = await res.text();
  setCache(url, text);
  return text;
}

async function readLesson(level: string, unit: string, lesson: string) {
  const rel01 = toPosix(path.join(GH.dir, level, `unit-${pad2(unit)}`, `lesson-${pad2(lesson)}.md`));
  const relNoPad = toPosix(path.join(GH.dir, level, `unit-${unit}`, `lesson-${lesson}.md`));

  const tryLocal = async (p: string) => fs.readFile(p, "utf8").catch(() => null);
  const tryGithub = async (r: string) => fetchGithubRaw(r).catch(() => null);

  let raw: string | null = null;

  if (SRC === "github") {
    raw = (await tryGithub(rel01)) ?? (await tryGithub(relNoPad));
  } else {
    const p01 = path.join(LOCAL_DIR, level, `unit-${pad2(unit)}`, `lesson-${pad2(lesson)}.md`);
    const pNo = path.join(LOCAL_DIR, level, `unit-${unit}`, `lesson-${lesson}.md`);
    raw = (await tryLocal(p01)) ?? (await tryLocal(pNo));
  }

  if (!raw) throw new Error("Lesson file not found (github/local)");

  const { data, content } = matter(raw);
  const steps = content.split(/\n-{3,}\n/g);
  return { meta: data, steps };
}

router.get("/:level/units/:unit/lessons/:lesson", async (req, res) => {
  try {
    const { level, unit, lesson } = req.params;
    const lessonData = await readLesson(level, unit, lesson);
    res.json(lessonData);
  } catch (e: any) {
    res.status(404).json({ error: "Lesson not found", details: e?.message });
  }
});

router.get("/:level/units/:unit", async (req, res) => {
  try {
    if (SRC !== "github") throw new Error("Unit listing requires GitHub mode with manifest.json");
    const { level, unit } = req.params;
    const rel = toPosix(path.join(GH.dir, level, `unit-${pad2(unit)}`, "manifest.json"));
    const raw = await fetchGithubRaw(rel);
    const list = JSON.parse(raw) as string[];
    const lessons = list
      .filter((f) => /^lesson-\d+\.md$/i.test(f))
      .map((f) => f.match(/\d+/)?.[0])
      .filter(Boolean);
    res.json(lessons);
  } catch (e: any) {
    res.status(404).json({ error: "Unit listing not available", details: e?.message });
  }
});

export default router;

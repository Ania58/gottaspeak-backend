import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { fetch as undiciFetch } from "undici";
import { Buffer } from "node:buffer";

const router = Router();

const SRC = (process.env.COURSES_SOURCE || "github").toLowerCase() as "github" | "local";

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

async function fetchRaw(relPath: string): Promise<string> {
  const rel = relPath.replace(/^\/+/, "");
  const isPrivate = !!GH.token;

  if (!isPrivate) {
    const rawUrl = `https://raw.githubusercontent.com/${GH.owner}/${GH.repo}/${GH.branch}/${rel}`;
    const cached = getCache(rawUrl);
    if (cached) return cached;
    const res = await undiciFetch(rawUrl);
    if (!res.ok) throw new Error(`RAW ${res.status} ${res.statusText} :: ${rawUrl}`);
    const text = await res.text();
    setCache(rawUrl, text);
    return text;
  }

  const apiUrl = `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${rel}?ref=${GH.branch}`;
  const cached = getCache(apiUrl);
  if (cached) return cached;
  const res = await undiciFetch(apiUrl, {
    headers: {
      Authorization: `token ${GH.token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "gottaspeak-backend",
    },
  } as any);
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText} :: ${apiUrl}`);
  const json = (await res.json()) as any;
  if (Array.isArray(json)) throw new Error("Expected file, got directory listing");
  if (!json.content || json.encoding !== "base64") throw new Error(`Invalid file response :: ${apiUrl}`);
  const text = Buffer.from(json.content, "base64").toString("utf8");
  setCache(apiUrl, text);
  return text;
}

async function listDir(relDir: string): Promise<string[]> {
  const rel = relDir.replace(/^\/+/, "");
  const isPrivate = !!GH.token;

  if (!isPrivate) {
    const apiUrl = `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${rel}?ref=${GH.branch}`;
    const cached = getCache(apiUrl);
    if (cached) return JSON.parse(cached);
    const res = await undiciFetch(apiUrl, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "gottaspeak-backend" } as any,
    });
    if (!res.ok) throw new Error(`GitHub list ${res.status} ${res.statusText} :: ${apiUrl}`);
    const json = (await res.json()) as any[];
    const names = json.map((e: any) => e.name as string);
    setCache(apiUrl, JSON.stringify(names));
    return names;
  }

  const apiUrl = `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${rel}?ref=${GH.branch}`;
  const cached = getCache(apiUrl);
  if (cached) return JSON.parse(cached);
  const res = await undiciFetch(apiUrl, {
    headers: {
      Authorization: `token ${GH.token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "gottaspeak-backend",
    },
  } as any);
  if (!res.ok) throw new Error(`GitHub list ${res.status} ${res.statusText} :: ${apiUrl}`);
  const json = (await res.json()) as any[];
  const names = json.map((e: any) => e.name as string);
  setCache(apiUrl, JSON.stringify(names));
  return names;
}

function buildRelPaths(level: string, unit: string, lesson: string) {
  const p1 = toPosix(path.join(GH.dir, level, `unit-${pad2(unit)}`, `lesson-${pad2(lesson)}.md`));
  const p2 = toPosix(path.join(GH.dir, level, `unit-${unit}`, `lesson-${lesson}.md`));
  return [p1, p2];
}

async function readLesson(level: string, unit: string, lesson: string) {
  const rels = buildRelPaths(level, unit, lesson);
  let raw: string | null = null;

  if (SRC === "github") {
    for (const r of rels) {
      raw = await fetchRaw(r).catch(() => null);
      if (raw) break;
    }
  } else {
    for (const r of rels) {
      const p = path.join(LOCAL_DIR, r.replace(new RegExp(`^${GH.dir}/?`), ""));
      raw = await fs.readFile(p, "utf8").catch(() => null);
      if (raw) break;
    }
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
    const { level, unit } = req.params;
    if (SRC === "github") {
      const relDir1 = toPosix(path.join(GH.dir, level, `unit-${pad2(unit)}`));
      const relDir2 = toPosix(path.join(GH.dir, level, `unit-${unit}`));
      let names = await listDir(relDir1).catch(() => null);
      if (!names) names = await listDir(relDir2);
      const lessons = names
        .filter((n) => /^lesson-\d+\.md$/i.test(n))
        .map((n) => n.match(/\d+/)?.[0])
        .filter(Boolean) as string[];
      res.json(lessons);
      return;
    }

    const localDir1 = path.join(LOCAL_DIR, level, `unit-${pad2(unit)}`);
    const localDir2 = path.join(LOCAL_DIR, level, `unit-${unit}`);
    let files: string[] | null = await fs.readdir(localDir1).catch(() => null as any);
    if (!files) files = await fs.readdir(localDir2);
    const lessons = files
      .filter((n) => /^lesson-\d+\.md$/i.test(n))
      .map((n) => n.match(/\d+/)?.[0])
      .filter(Boolean) as string[];
    res.json(lessons);
  } catch (e: any) {
    res.status(404).json({ error: "Unit listing not available", details: e?.message });
  }
});

export default router;

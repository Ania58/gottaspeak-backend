import type { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { isValidObjectId } from "mongoose";
import { SessionModel } from "./session.model";
import { ConfigModel } from "../models/config/config.model"; 

const JWT_SECRET = process.env.SESSION_JWT_SECRET || "dev-secret";

export async function joinSession(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const token = String(req.query.t || "");

    if (!token) return res.status(401).json({ error: "Missing token" });
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid session id" });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e: any) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    if (!payload?.sessionId || String(payload.sessionId) !== String(id)) {
      return res.status(401).json({ error: "Token does not match session" });
    }

    const session = await SessionModel.findById(id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const base =
      (await ConfigModel.findById("site"))?.lessonJoinUrl || "https://meet.jit.si";
    const baseTrimmed = base.replace(/\/+$/, "");

    const displayName = String(payload.displayName || "Guest");
    const callUrl = `${baseTrimmed}/${session.room}#userInfo.displayName=${encodeURIComponent(
      displayName
    )}`;

    return res.json({
      url: callUrl,
      session: {
        id: session._id,
        room: session.room,
        courseLevel: session.courseLevel,
        unit: session.unit,
        lesson: session.lesson,
        expiresAt: session.expiresAt ?? null,
      },
      me: {
        role: payload.role || "student",
        displayName,
        userId: payload.userId || null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

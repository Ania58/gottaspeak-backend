import { Router } from "express";
import { createSession, getSession } from "./session.controller";

const router = Router();

router.post("/", createSession);

router.get("/:id", getSession);

export default router;

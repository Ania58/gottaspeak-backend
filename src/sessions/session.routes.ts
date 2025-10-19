import { Router } from "express";
import { createSession, getSession } from "./session.controller";
import { createInviteLink } from "./session.invite.controller";
import { joinSession } from "./session.join.controller";

const router = Router();

router.post("/", createSession);

router.get("/:id", getSession);

router.post("/invite", createInviteLink);

router.get("/:id/join", joinSession);

export default router;

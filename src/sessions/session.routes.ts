import { Router } from "express";
import { createSession, getSession } from "./session.controller";
import { createInviteLink } from "./session.invite.controller";

const router = Router();

router.post("/", createSession);

router.get("/:id", getSession);

router.post("/invite", createInviteLink);

export default router;

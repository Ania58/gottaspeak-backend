import { Router } from "express";
import { createSession, getSession } from "./session.controller";
import { createInviteLink } from "./session.invite.controller";
import { joinSession } from "./session.join.controller";
import { joinSessionAuthenticated } from "./session.authjoin.controller"; 
import { listSessions } from "./session.list.controller";


const router = Router();

router.post("/", createSession);

router.get("/", listSessions);

router.get("/:id", getSession);

router.post("/invite", createInviteLink);

router.get("/:id/join", joinSession);

router.post("/:id/join", joinSessionAuthenticated);

export default router;

import { Router } from "express";
import { listMessages, createMessage } from "./message.controller";

const router = Router();

router.get("/", listMessages);  
router.post("/", createMessage);

export default router;

import { Router } from "express";
import { listMessages, createMessage, listThreads } from "./message.controller";

const router = Router();

router.get("/threads", listThreads); 
router.get("/", listMessages);  
router.post("/", createMessage);

export default router;

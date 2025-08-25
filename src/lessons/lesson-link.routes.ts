import { Router } from "express";
import { createLessonLink, getLessonLink } from "./lesson-link.controller";

const router = Router();
router.post("/", createLessonLink);   
router.get("/:room", getLessonLink);  

export default router;

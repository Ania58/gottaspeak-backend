import { Router } from "express";
import { listProgress, upsertProgress } from "./progress.controller";

const router = Router();
router.get("/", listProgress);
router.put("/", upsertProgress); 
export default router;

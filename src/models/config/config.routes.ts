import { Router } from "express";
import { getPublicConfig, updateConfig } from "./config.controller";
import { adminGuard } from "../../middleware/adminGuard";

const router = Router();

router.get("/public", getPublicConfig);
router.put("/", adminGuard, updateConfig);

export default router;

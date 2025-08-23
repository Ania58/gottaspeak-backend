import { Router } from "express";
import {
  listMaterials,
  getMaterialByTypeSlug,
  createMaterial,
  updateMaterial,
  deleteMaterialById,
} from "./material.controller";

const router = Router();

router.get("/", listMaterials);
router.get("/:type/:slug", getMaterialByTypeSlug);
router.post("/", createMaterial);
router.put("/:slug", updateMaterial);     
router.delete("/:id", deleteMaterialById);  

export default router;

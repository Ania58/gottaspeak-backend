import { Router } from "express";
import {
  listMaterials,
  getMaterialByTypeSlug,
  createMaterial,
  updateMaterialById,
  deleteMaterialById,
} from "./material.controller";

const router = Router();

router.get("/", listMaterials);
router.get("/:type/:slug", getMaterialByTypeSlug);
router.post("/", createMaterial);
router.put("/:id", updateMaterialById);     
router.delete("/:id", deleteMaterialById);  

export default router;

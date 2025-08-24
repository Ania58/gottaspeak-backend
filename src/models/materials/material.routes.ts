import { Router } from "express";
import {
  listMaterials,
  getMaterialByTypeSlug,
  createMaterial,
  updateMaterialById,
  deleteMaterialById,
} from "./material.controller";
import { adminGuard } from "../../middleware/adminGuard";

const router = Router();

router.get("/", listMaterials);
router.get("/:type/:slug", getMaterialByTypeSlug);
router.post("/", adminGuard, createMaterial);
router.put("/:id", adminGuard, updateMaterialById);     
router.delete("/:id", adminGuard, deleteMaterialById);  

export default router;

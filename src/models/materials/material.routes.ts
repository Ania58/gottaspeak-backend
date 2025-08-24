import { Router } from "express";
import {
  listMaterials,
  getMaterialByTypeSlug,
  createMaterial,
  updateMaterialById,
  deleteMaterialById,
  publishMaterial,     
  unpublishMaterial,
  listMaterialTags, 
} from "./material.controller";
import { adminGuard } from "../../middleware/adminGuard";

const router = Router();

router.get("/", listMaterials);
router.get("/tags", listMaterialTags);
router.get("/:type/:slug", getMaterialByTypeSlug);
router.post("/", adminGuard, createMaterial);
router.put("/:id", adminGuard, updateMaterialById);     
router.delete("/:id", adminGuard, deleteMaterialById);  

router.put("/:id/publish", adminGuard, publishMaterial);
router.put("/:id/unpublish", adminGuard, unpublishMaterial);

export default router;

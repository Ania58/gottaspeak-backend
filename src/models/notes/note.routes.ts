import { Router } from "express";
import {
  listNotes,
  createNote,
  updateNoteById,
  deleteNoteById,
} from "./note.controller";
import { adminGuard } from "../../middleware/adminGuard";

const router = Router();

router.get("/", listNotes);

router.post("/", adminGuard, createNote);
router.put("/:id", adminGuard, updateNoteById);
router.delete("/:id", adminGuard, deleteNoteById);

export default router;

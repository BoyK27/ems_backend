import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import {
  addExamSession,
  getExamSessions,
  togglePublishStatus,
  deleteExamSession,
} from "../controllers/examSessionController.js";

const router = express.Router();

router.post("/add", authMiddleware, addExamSession);
router.get("/", authMiddleware, getExamSessions);
router.put("/publish/:id", authMiddleware, togglePublishStatus);
router.delete("/:id", authMiddleware, deleteExamSession);

export default router;

import express from "express";
import {
  saveMarks,
  getMarksForClassSubject,
  getStudentMarks,
} from "../controllers/markController.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();

// Route to save/update marks
router.post("/save", authMiddleware, saveMarks);

// Route to fetch marks for lecturer view
router.get("/class-subject", authMiddleware, getMarksForClassSubject);

// --- EXPRESS 5 FIX FOR OPTIONAL PARAMETERS ---
// 1. Route WITHOUT optional examSessionId
router.get("/student/:studentId", authMiddleware, getStudentMarks);

// 2. Route WITH examSessionId
router.get(
  "/student/:studentId/:examSessionId",
  authMiddleware,
  getStudentMarks,
);

export default router;

import express from "express";
import {
  submitOrUpdateMarks,
  getMarksByClassAndSubject,
  getStudentMarks,
} from "../controllers/markController.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();

// Save or edit marks
router.post("/save", authMiddleware, submitOrUpdateMarks);

// Fetch class/subject marks using Query Params (?classId=...&subjectId=...&examSessionId=...)
router.get("/class-subject", authMiddleware, getMarksByClassAndSubject);

// Express 5 compatible routes for student marks
router.get("/student/:studentId", authMiddleware, getStudentMarks);
router.get(
  "/student/:studentId/:examSessionId",
  authMiddleware,
  getStudentMarks,
);

export default router;

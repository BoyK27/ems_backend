import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import {
  submitOrUpdateMarks,
  getMarksByClassAndSubject,
  getStudentMarks,
} from "../controllers/markController.js";

const router = express.Router();

router.post("/save", authMiddleware, submitOrUpdateMarks);
router.get(
  "/class/:classId/subject/:subjectId/session/:examSessionId",
  authMiddleware,
  getMarksByClassAndSubject,
);
router.get(
  "/student/:studentId/:examSessionId?",
  authMiddleware,
  getStudentMarks,
);

export default router;

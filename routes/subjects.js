import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import {
  addSubject,
  getSubjects,
  getSubjectsByClass,
  getTeacherAssignedSubjects,
  updateSubject,
  deleteSubject,
} from "../controllers/subjectController.js";

const router = express.Router();

router.post("/add", authMiddleware, addSubject);
router.get("/", authMiddleware, getSubjects);
router.get("/class/:classId", authMiddleware, getSubjectsByClass);
router.get("/assigned/:classId", authMiddleware, getTeacherAssignedSubjects);
router.put("/:id", authMiddleware, updateSubject);
router.delete("/:id", authMiddleware, deleteSubject);

export default router;

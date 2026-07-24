import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import {
  addStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  fetchStudentsByDepartment,
} from "../controllers/studentController.js";

const router = express.Router();

router.post("/add", authMiddleware, addStudent);
router.get("/", authMiddleware, getStudents);
router.get("/department/:id", authMiddleware, fetchStudentsByDepartment);
router.get("/:id", authMiddleware, getStudent);
router.put("/:id", authMiddleware, updateStudent);
router.delete("/:id", authMiddleware, deleteStudent);

export default router;

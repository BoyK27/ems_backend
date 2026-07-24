import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  updateStudentAttendance,
  batchUpdateStudentAttendance,
  getStudentAttendanceByDate,
  getStudentAttendanceHistory,
  getDepartmentAttendanceReport,
} from "../controllers/studentAttendanceController.js";

const router = express.Router();

router.post("/update", authMiddleware, updateStudentAttendance);
router.post("/batch-update", authMiddleware, batchUpdateStudentAttendance);
router.get("/date", authMiddleware, getStudentAttendanceByDate);
router.get("/report", authMiddleware, getDepartmentAttendanceReport);
router.get("/:id", authMiddleware, getStudentAttendanceHistory);

export default router;

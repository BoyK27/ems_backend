import express from "express";
import { getAttendance } from "../controllers/attendanceController.js";
import verifyUser from "../middleware/authmiddleware.js";
import defaultAttendance from "../middleware/defaultAttendance.js";
import {
  updateAttendance,
  attenddanceReport,
} from "../controllers/attendanceController.js";

const router = express.Router();

router.get("/", verifyUser, defaultAttendance, getAttendance);
router.put("/update/:employeeId", verifyUser, updateAttendance);
router.get("/report", verifyUser, attenddanceReport);

export default router;

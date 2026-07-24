import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  addStudentLeave,
  getStudentLeave,
  getStudentLeaves,
  getStudentLeaveDetail,
  updateStudentLeave,
} from "../controllers/studentLeaveController.js";

const router = express.Router();

router.post("/add", authMiddleware, addStudentLeave);
router.get("/", authMiddleware, getStudentLeaves);
router.get("/detail/:id", authMiddleware, getStudentLeaveDetail);
router.get("/:id/:role", authMiddleware, getStudentLeave);
router.put("/:id", authMiddleware, updateStudentLeave);

export default router;

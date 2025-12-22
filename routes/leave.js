import express from "express";
import authmiddleware from "../middleware/authmiddleware.js";
import {
  addLeave,
  getLeave,
  getLeaves,
  getLeaveDetail,
  updateLeave,
} from "../controllers/leaveController.js";

const router = express.Router();

router.post("/add", authmiddleware, addLeave);
router.get("/detail/:id", authmiddleware, getLeaveDetail);

router.get("/:id/:role", authmiddleware, getLeave);
router.get("/", authmiddleware, getLeaves);
router.put("/:id", updateLeave);

export default router;

import express from "express";
import {
  getSemesterReportCard,
  getClassReportCardSummary,
  togglePublishReportCards,
} from "../controllers/reportCardController.js";
import verifyUser from "../middleware/authmiddleware.js";
import verifyRole from "../middleware/verifyRole.js";

const router = express.Router();

// Class Leaderboard (Admin only)
router.get(
  "/class-summary/:semesterId",
  verifyUser,
  verifyRole(["admin"]),
  getClassReportCardSummary,
);

// Individual Student Report Card (Admins & Students)
router.get(
  "/student/:studentId/semester/:semesterId",
  verifyUser,
  verifyRole(["admin", "student"]),
  getSemesterReportCard,
);

// Toggle publish state (Admin only)
router.put(
  "/publish/:semesterId",
  verifyUser,
  verifyRole(["admin"]),
  togglePublishReportCards,
);

export default router;

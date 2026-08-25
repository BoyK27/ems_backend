import express from "express";
import {
  getSemesterReportCard,
  getClassReportCardSummary,
  togglePublishReportCards,
} from "../controllers/reportCardController.js";
import verifyUser from "../middleware/authmiddleware.js";

const router = express.Router();

// Class Leaderboard
router.get("/class-summary/:semesterId", verifyUser, getClassReportCardSummary);

// Individual Student Report Card
router.get(
  "/student/:studentId/semester/:semesterId",
  verifyUser,
  getSemesterReportCard,
);

// Toggle publish state
router.put("/publish/:semesterId", verifyUser, togglePublishReportCards);

export default router;

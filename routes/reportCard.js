import express from "express";
import {
  getSemesterReportCard,
  togglePublishReportCards,
} from "../controllers/reportCardController.js";
import verifyUser from "../middleware/authmiddleware.js";
import verifyRole from "../middleware/verifyRole.js";

const router = express.Router();

// Fetch report card (Admins & Students only)
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

import express from "express";
import {
  createSemester,
  getSemestersByClass,
} from "../controllers/semesterController.js";
import verifyUser from "../middleware/authmiddleware.js"; // Adjust path to your auth middleware

const router = express.Router();

// Route to create a new semester
router.post("/add", verifyUser, createSemester);

// Route to get all semesters belonging to a specific class
router.get("/class/:classId", verifyUser, getSemestersByClass);

export default router;

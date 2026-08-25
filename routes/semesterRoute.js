import express from "express";
import {
  createSemester,
  getAllSemesters,
  getSemestersByClass,
} from "../controllers/semesterController.js";
import verifyUser from "../middleware/authmiddleware.js";

const router = express.Router();

// Route to get all semesters (Resolves GET /api/semester 404)
router.get("/", verifyUser, getAllSemesters);

// Route to create a new semester
router.post("/add", verifyUser, createSemester);

// Route to get all semesters belonging to a specific class
router.get("/class/:classId", verifyUser, getSemestersByClass);

export default router;

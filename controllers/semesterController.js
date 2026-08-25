import Semester from "../models/Semester.js";

// Create or configure a new Semester
const createSemester = async (req, res) => {
  try {
    const { name, academicYear, classId, sessions } = req.body;

    if (!name || !classId) {
      return res.status(400).json({
        success: false,
        error: "Semester name and Class are required.",
      });
    }

    const semester = new Semester({
      name,
      academicYear: academicYear || "2025/2026",
      classId,
      sessions: sessions || [],
    });

    await semester.save();

    return res.status(201).json({
      success: true,
      message: "Semester created successfully",
      semester,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Server error creating semester" });
  }
};

// Get ALL semesters (Fixes the GET /api/semester 404 error)
const getAllSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find()
      .populate("sessions.sessionId")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, semesters });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Server error fetching all semesters" });
  }
};

// Get semesters by Class ID
const getSemestersByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const semesters = await Semester.find({ classId })
      .populate("sessions.sessionId")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, semesters });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Server error fetching semesters" });
  }
};

export { createSemester, getAllSemesters, getSemestersByClass };

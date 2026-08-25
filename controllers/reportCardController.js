import Mark from "../models/Marks.js";
import Semester from "../models/Semester.js";

// GET: Fetch Compiled Semester Report Card
export const getSemesterReportCard = async (req, res) => {
  try {
    const { studentId, semesterId } = req.params;

    // Fetch Semester configuration
    const semester = await Semester.findById(semesterId).populate(
      "sessions.examSessionId",
    );
    if (!semester) {
      return res
        .status(404)
        .json({ success: false, error: "Semester not found" });
    }

    // 🔒 GUARD 1: If user is a Student, ensure results are published
    if (req.user.role === "student" && !semester.isReportCardPublished) {
      return res.status(403).json({
        success: false,
        error:
          "Semester report cards have not been published by the administration yet.",
      });
    }

    // 🔒 GUARD 2: Prevent Students from viewing each other's report cards
    if (req.user.role === "student" && req.user._id.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized to view this report card.",
      });
    }

    // ... Proceed with compilation logic (Rank, Weights, Normalized Averages) ...

    return res.status(200).json({
      success: true,
      reportCard: {
        semesterName: semester.name,
        academicYear: semester.academicYear,
        isPublished: semester.isReportCardPublished,
        // compiled report card payload
      },
    });
  } catch (error) {
    console.error("Report Card Error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Server error fetching report card" });
  }
};

// PUT: Admin Only — Publish/Unpublish Semester Report Cards
export const togglePublishReportCards = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { isPublished } = req.body; // boolean

    const semester = await Semester.findByIdAndUpdate(
      semesterId,
      {
        isReportCardPublished: isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
      { new: true },
    );

    if (!semester) {
      return res
        .status(404)
        .json({ success: false, error: "Semester not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Report cards ${isPublished ? "published" : "unpublished"} successfully.`,
      semester,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to update publish status" });
  }
};

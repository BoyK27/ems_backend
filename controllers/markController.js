import Mark from "../models/Marks.js";
import Student from "../models/Student.js";
import Employee from "../models/Employee.js";

// 1. Submit or Edit batch marks (Lecturers)
const submitOrUpdateMarks = async (req, res) => {
  try {
    // Array of mark items: [{ studentId, subjectId, classId, examSessionId, score, outOf }]
    const { marks } = req.body;

    if (!marks || !Array.isArray(marks) || marks.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "No marks provided for submission" });
    }

    // Find employee profile to identify who entered/edited the marks
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, error: "Lecturer profile not found" });
    }

    // Bulk upsert operations
    const bulkOps = marks.map((item) => ({
      updateOne: {
        filter: {
          studentId: item.studentId,
          subjectId: item.subjectId,
          examSessionId: item.examSessionId,
        },
        update: {
          $set: {
            classId: item.classId,
            score: Number(item.score),
            outOf: Number(item.outOf) || 20, // 👈 Saved max possible score (default 20)
            enteredBy: employee._id,
          },
        },
        upsert: true,
      },
    }));

    await Mark.bulkWrite(bulkOps);

    return res
      .status(200)
      .json({ success: true, message: "Marks saved/updated successfully" });
  } catch (error) {
    console.error("Error saving marks:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Server error updating student marks" });
  }
};

// 2. Get existing marks for a class, subject & session
const getMarksByClassAndSubject = async (req, res) => {
  try {
    const { classId, subjectId, examSessionId } = req.query;

    if (!classId || !subjectId || !examSessionId) {
      return res.status(400).json({
        success: false,
        error: "Missing classId, subjectId, or examSessionId in request query",
      });
    }

    // Fetch marks for this specific evaluation slot
    const marks = await Mark.find({ classId, subjectId, examSessionId });

    // Extract outOf value if marks already exist (defaults to 20)
    const outOf = marks.length > 0 && marks[0].outOf ? marks[0].outOf : 20;

    // Fetch enrolled students
    const students = await Student.find({ classId })
      .populate("userId", "name profileImage")
      .sort({ studentId: 1 });

    return res.status(200).json({ success: true, students, marks, outOf });
  } catch (error) {
    console.error("Error fetching class marks:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Server error fetching marks" });
  }
};

// controllers/markController.js

// Express controller (e.g., markController.js)
export const getStudentMarks = async (req, res) => {
  try {
    const { studentId, sessionId } = req.params;

    // 1. Build filter query
    let query = { studentId: studentId };

    // 2. Only filter by session if it's NOT "all"
    if (sessionId && sessionId !== "all") {
      query.examSessionId = sessionId;
    }

    // 3. Fetch marks and populate subject & session details
    const marks = await Mark.find(query)
      .populate("subjectId", "subjectName subjectCode")
      .populate("examSessionId", "sessionName isPublished");

    // 4. Filter out any marks where the exam session isn't published yet (optional safeguard)
    const publishedMarks = marks.filter((m) => m.examSessionId?.isPublished);

    // 5. Calculate Average & Total
    const totalScore = publishedMarks.reduce(
      (acc, curr) => acc + curr.score,
      0,
    );
    const totalSubjects = publishedMarks.length;
    const average =
      totalSubjects > 0 ? (totalScore / totalSubjects).toFixed(2) : "0.00";

    return res.status(200).json({
      success: true,
      marks: publishedMarks,
      totalScore,
      average,
      totalSubjects,
    });
  } catch (error) {
    console.error("Error fetching marks:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
export { submitOrUpdateMarks, getMarksByClassAndSubject, getStudentMarks };

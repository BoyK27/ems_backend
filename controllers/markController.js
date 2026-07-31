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

// 3. Get Student's marks & calculate overall average for dashboard
const getStudentMarks = async (req, res) => {
  try {
    const { studentId, examSessionId } = req.params;

    let student = await Student.findById(studentId);
    if (!student) {
      student = await Student.findOne({ userId: studentId });
    }

    if (!student) {
      return res
        .status(404)
        .json({ success: false, error: "Student profile not found" });
    }

    const filter = { studentId: student._id };
    if (examSessionId && examSessionId !== "all") {
      filter.examSessionId = examSessionId;
    }

    const marks = await Mark.find(filter)
      .populate("subjectId", "subjectName subjectCode")
      .populate("examSessionId", "sessionName isPublished")
      .sort({ createdAt: -1 });

    // Calculate normalized average normalized to /20 standard scale
    let totalNormalized = 0;
    marks.forEach((m) => {
      const maxScore = m.outOf || 20;
      totalNormalized += (m.score / maxScore) * 20;
    });

    const average =
      marks.length > 0 ? (totalNormalized / marks.length).toFixed(2) : "0.00";

    const totalScore = marks.reduce((acc, curr) => acc + curr.score, 0);

    return res.status(200).json({
      success: true,
      marks,
      totalScore,
      average,
      totalSubjects: marks.length,
    });
  } catch (error) {
    console.error("Error fetching student report:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Server error fetching student marks" });
  }
};

export { submitOrUpdateMarks, getMarksByClassAndSubject, getStudentMarks };

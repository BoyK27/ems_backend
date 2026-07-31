import Mark from "../models/Mark.js";
import Student from "../models/Student.js";
import Employee from "../models/Employee.js";

// 1. Submit or Edit batch marks (Lecturers)
const submitOrUpdateMarks = async (req, res) => {
  try {
    // Array of mark items: [{ studentId, subjectId, classId, examSessionId, score }]
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

// 2. Get existing marks for a class, subject & session (for filling/editing in table view)
const getMarksByClassAndSubject = async (req, res) => {
  try {
    const { classId, subjectId, examSessionId } = req.params;

    // Fetch marks for this specific evaluation slot
    const marks = await Mark.find({ classId, subjectId, examSessionId });

    // Also fetch students enrolled in this class to map empty rows if necessary
    const students = await Student.find({ classId })
      .populate("userId", "name profileImage")
      .sort({ studentId: 1 });

    return res.status(200).json({ success: true, students, marks });
  } catch (error) {
    console.error("Error fetching class marks:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Server error fetching marks" });
  }
};

// 3. Get Student's marks & calculate overall average for their dashboard
const getStudentMarks = async (req, res) => {
  try {
    const { studentId, examSessionId } = req.params;

    // Find student document
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

    // Calculate total & dynamic average score
    const totalScore = marks.reduce((acc, curr) => acc + curr.score, 0);
    const average =
      marks.length > 0 ? (totalScore / marks.length).toFixed(2) : "0.00";

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

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

const getStudentMarks = async (req, res) => {
  try {
    const { studentId, examSessionId } = req.params;

    // 1. Find the Student document by either Student._id OR Student.userId
    let student = null;
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      student = await Student.findOne({
        $or: [
          { _id: new mongoose.Types.ObjectId(studentId) },
          { userId: new mongoose.Types.ObjectId(studentId) },
        ],
      });
    }

    if (!student) {
      console.log(`[DEBUG] No student found matching ID: ${studentId}`);
      return res.status(200).json({
        success: true,
        marks: [],
        totalScore: 0,
        average: "0.00",
        totalSubjects: 0,
      });
    }

    // 2. Build filter for the Marks collection using the resolved Student _id
    const filter = { studentId: student._id };

    if (
      examSessionId &&
      examSessionId !== "all" &&
      mongoose.Types.ObjectId.isValid(examSessionId)
    ) {
      filter.examSessionId = new mongoose.Types.ObjectId(examSessionId);
    }

    console.log("[DEBUG] Searching marks with filter:", filter);

    // 3. Retrieve marks and populate
    const marks = await Mark.find(filter)
      .populate("subjectId", "name subjectName code subjectCode")
      .populate("examSessionId", "sessionName isPublished");

    console.log(`[DEBUG] Found ${marks.length} mark entries.`);

    // 4. Return results
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
    console.error("Error in getStudentMarks:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export { submitOrUpdateMarks, getMarksByClassAndSubject, getStudentMarks };

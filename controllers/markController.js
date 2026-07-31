import mongoose from "mongoose";
import Mark from "../models/Marks.js";
import Student from "../models/Student.js";
import Employee from "../models/Employee.js";

// 1. Submit or Edit batch marks (Lecturers)
const submitOrUpdateMarks = async (req, res) => {
  try {
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
    const bulkOps = marks.map((item) => {
      // Convert all strings to proper MongoDB ObjectIds safely
      const studentObjId = new mongoose.Types.ObjectId(item.studentId);
      const subjectObjId = new mongoose.Types.ObjectId(item.subjectId);
      const sessionObjId = new mongoose.Types.ObjectId(item.examSessionId);
      const classObjId = item.classId
        ? new mongoose.Types.ObjectId(item.classId)
        : null;

      return {
        updateOne: {
          filter: {
            studentId: studentObjId,
            subjectId: subjectObjId,
            examSessionId: sessionObjId,
          },
          update: {
            $set: {
              classId: classObjId,
              score: Number(item.score) || 0,
              outOf: Number(item.outOf) || 20,
              enteredBy: employee._id,
            },
          },
          upsert: true,
        },
      };
    });

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

// 2. Get existing marks for a class, subject & session (Lecturer Grid)
const getMarksByClassAndSubject = async (req, res) => {
  try {
    const { classId, subjectId, examSessionId } = req.query;

    if (!classId || !subjectId || !examSessionId) {
      return res.status(400).json({
        success: false,
        error: "Missing classId, subjectId, or examSessionId query parameters",
      });
    }

    // Convert strings to valid Mongoose ObjectIds for reliable matching
    const classObjId = new mongoose.Types.ObjectId(classId);
    const subjectObjId = new mongoose.Types.ObjectId(subjectId);
    const sessionObjId = new mongoose.Types.ObjectId(examSessionId);

    // 1. Fetch marks for this specific evaluation slot
    const marks = await Mark.find({
      classId: classObjId,
      subjectId: subjectObjId,
      examSessionId: sessionObjId,
    });

    const outOf = marks.length > 0 && marks[0].outOf ? marks[0].outOf : 20;

    // 2. Fetch enrolled students for this class ID (cast to ObjectId)
    const students = await Student.find({
      $or: [{ classId: classObjId }, { classId: classId }],
    })
      .populate("userId", "name profileImage")
      .sort({ studentId: 1 });

    return res.status(200).json({ success: true, students, marks, outOf });
  } catch (error) {
    console.error("Error fetching class marks:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Server error fetching marks sheet" });
  }
};

// 3. Get Student Marks Report (Student Dashboard)
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
      console.log(
        `[DEBUG] No student profile found for identifier: ${studentId}`,
      );
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

    console.log("[DEBUG] Fetching marks with filter:", filter);

    // 3. Retrieve marks and populate referenced documents
    const rawMarks = await Mark.find(filter)
      .populate("subjectId", "name subjectName code subjectCode")
      .populate("examSessionId", "sessionName isPublished");

    // 4. Filter to include ONLY marks where the Exam Session is published
    const publishedMarks = rawMarks.filter(
      (m) => m.examSessionId && m.examSessionId.isPublished === true,
    );

    // 5. Calculate Metrics
    const totalScore = publishedMarks.reduce(
      (acc, curr) => acc + curr.score,
      0,
    );
    const average =
      publishedMarks.length > 0
        ? (totalScore / publishedMarks.length).toFixed(2)
        : "0.00";

    return res.status(200).json({
      success: true,
      marks: publishedMarks,
      totalScore,
      average,
      totalSubjects: publishedMarks.length,
    });
  } catch (error) {
    console.error("Error in getStudentMarks:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export { submitOrUpdateMarks, getMarksByClassAndSubject, getStudentMarks };

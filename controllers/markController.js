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
        .json({ success: false, error: "No marks provided" });
    }

    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, error: "Lecturer profile not found" });
    }

    const bulkOps = marks.map((item) => {
      const studentObjId = new mongoose.Types.ObjectId(item.studentId);
      const subjectObjId = new mongoose.Types.ObjectId(item.subjectId);
      const sessionObjId = new mongoose.Types.ObjectId(item.examSessionId);
      const semesterObjId = new mongoose.Types.ObjectId(item.semesterId); // 👈 Added
      const classObjId = new mongoose.Types.ObjectId(item.classId);

      return {
        updateOne: {
          filter: {
            studentId: studentObjId,
            subjectId: subjectObjId,
            examSessionId: sessionObjId,
            semesterId: semesterObjId, // 👈 Match by semester as well
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
      .json({ success: true, message: "Marks saved successfully" });
  } catch (error) {
    console.error("Error saving marks:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Server error updating marks" });
  }
};

// 2. Get existing marks for a class, subject & session (Lecturer Grid)
const getMarksByClassAndSubject = async (req, res) => {
  try {
    const { classId, subjectId, examSessionId, semesterId } = req.query; // 👈 Accept semesterId

    if (!classId || !subjectId || !examSessionId || !semesterId) {
      return res.status(400).json({
        success: false,
        error: "Missing classId, subjectId, examSessionId, or semesterId",
      });
    }

    const classObjId = new mongoose.Types.ObjectId(classId);
    const subjectObjId = new mongoose.Types.ObjectId(subjectId);
    const sessionObjId = new mongoose.Types.ObjectId(examSessionId);
    const semesterObjId = new mongoose.Types.ObjectId(semesterId);

    const marks = await Mark.find({
      classId: classObjId,
      subjectId: subjectObjId,
      examSessionId: sessionObjId,
      semesterId: semesterObjId, // 👈 Query including semesterId
    });

    const outOf = marks.length > 0 && marks[0].outOf ? marks[0].outOf : 20;

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
      .json({ success: false, error: "Server error fetching sheet" });
  }
};

// 3. Get Student Marks Report (Student Dashboard)
const getStudentMarks = async (req, res) => {
  try {
    const { studentId, examSessionId } = req.params;
    const { semesterId } = req.query; // 👈 Read semesterId from query params

    // 1. Find Student profile by _id OR userId
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
      return res.status(200).json({
        success: true,
        marks: [],
        totalScore: 0,
        average: "0.00",
        totalSubjects: 0,
      });
    }

    // 2. Build Query Filter
    const filter = { studentId: student._id };

    if (
      examSessionId &&
      examSessionId !== "all" &&
      mongoose.Types.ObjectId.isValid(examSessionId)
    ) {
      filter.examSessionId = new mongoose.Types.ObjectId(examSessionId);
    }

    if (
      semesterId &&
      semesterId !== "all" &&
      mongoose.Types.ObjectId.isValid(semesterId)
    ) {
      filter.semesterId = new mongoose.Types.ObjectId(semesterId); // 👈 Add semester filter
    }

    // 3. Fetch marks and populate references
    const rawMarks = await Mark.find(filter)
      .populate("subjectId", "name subjectName code subjectCode")
      .populate("examSessionId", "sessionName isPublished")
      .populate("semesterId", "name semesterName"); // 👈 Populate Semester

    // 4. Safe Filter: Include marks where session is explicitly published OR undefined
    const publishedMarks = rawMarks.filter((m) => {
      if (!m.examSessionId) return false;
      return m.examSessionId.isPublished !== false;
    });

    // 5. Calculate Metrics
    const totalScore = publishedMarks.reduce(
      (acc, curr) => acc + curr.score,
      0,
    );
    const totalPossible = publishedMarks.reduce(
      (acc, curr) => acc + (curr.outOf || 20),
      0,
    );

    const average =
      totalPossible > 0
        ? ((totalScore / totalPossible) * 20).toFixed(2)
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

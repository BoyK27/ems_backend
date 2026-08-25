import mongoose from "mongoose";
import Mark from "../models/Marks.js";
import Student from "../models/Student.js";
import Employee from "../models/Employee.js";
import Semester from "../models/Semester.js";
import ExamSession from "../models/ExamSessions.js";

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
      if (
        !item.semesterId ||
        !mongoose.Types.ObjectId.isValid(item.semesterId)
      ) {
        throw new Error(
          `Invalid or missing semesterId for student ${item.studentId}`,
        );
      }

      const studentObjId = new mongoose.Types.ObjectId(item.studentId);
      const subjectObjId = new mongoose.Types.ObjectId(item.subjectId);
      const sessionObjId = new mongoose.Types.ObjectId(item.examSessionId);
      const semesterObjId = new mongoose.Types.ObjectId(item.semesterId);
      const classObjId = new mongoose.Types.ObjectId(item.classId);

      return {
        updateOne: {
          filter: {
            studentId: studentObjId,
            subjectId: subjectObjId,
            examSessionId: sessionObjId,
            semesterId: semesterObjId,
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
    return res.status(500).json({
      success: false,
      error: error.message || "Server error updating marks",
    });
  }
};

// 2. Get existing marks for a class, subject & session (Lecturer Grid)
const getMarksByClassAndSubject = async (req, res) => {
  try {
    const { classId, subjectId, examSessionId, semesterId } = req.query;

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
      semesterId: semesterObjId,
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
    const { semesterId } = req.query;

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

    // Handle session filtering
    if (
      examSessionId &&
      examSessionId !== "all" &&
      mongoose.Types.ObjectId.isValid(examSessionId)
    ) {
      filter.examSessionId = new mongoose.Types.ObjectId(examSessionId);
    }

    // Handle semester filtering across direct foreign key and embedded array references
    if (
      semesterId &&
      semesterId !== "all" &&
      mongoose.Types.ObjectId.isValid(semesterId)
    ) {
      const semObjId = new mongoose.Types.ObjectId(semesterId);

      // Find sessions attached to this semester array
      const semesterDoc = await Semester.findById(semObjId)
        .select("sessions")
        .lean();
      const embeddedSessionIds = (semesterDoc?.sessions || [])
        .map((s) => s.sessionId)
        .filter(Boolean);

      // Find sessions directly referencing this semesterId
      const directSessions = await ExamSession.find({ semesterId: semObjId })
        .select("_id")
        .lean();
      const directSessionIds = directSessions.map((s) => s._id);

      const allSemesterSessionIds = [
        ...new Set([
          ...embeddedSessionIds.map((id) => id.toString()),
          ...directSessionIds.map((id) => id.toString()),
        ]),
      ].map((id) => new mongoose.Types.ObjectId(id));

      filter.$or = [
        { semesterId: semObjId },
        { examSessionId: { $in: allSemesterSessionIds } },
      ];
    }

    // 3. Fetch marks and populate references
    const rawMarks = await Mark.find(filter)
      .populate("subjectId", "name subjectName code subjectCode credits")
      .populate("examSessionId", "sessionName isPublished")
      .populate("semesterId", "name semesterName")
      .lean();

    // 4. Safe Filter: Include marks where session is explicitly published OR undefined
    const publishedMarks = rawMarks.filter((m) => {
      if (!m.examSessionId) return true; // Include legacy marks without session populated
      return m.examSessionId.isPublished !== false;
    });

    // 5. Calculate Metrics
    const totalScore = publishedMarks.reduce(
      (acc, curr) => acc + (curr.score || 0),
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

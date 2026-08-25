import Mark from "../models/Marks.js";
import Semester from "../models/Semester.js";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";

// Helper: Calculate Letter Grade
const getGrade = (mark) => {
  if (mark >= 16) return "A";
  if (mark >= 14) return "B";
  if (mark >= 12) return "C";
  if (mark >= 10) return "D";
  return "F";
};

// Helper: Process Class Marks & Compute Leaderboard with Rankings
const computeClassLeaderboard = async (semesterId) => {
  const semester = await Semester.findById(semesterId);
  if (!semester) throw new Error("Semester not found");

  const classStudents = await Student.find({
    classId: semester.classId,
  }).populate("userId", "name");
  const semesterMarks = await Mark.find({ semesterId }).populate(
    "subjectId examSessionId",
  );

  // Map students to subjects & session marks
  const studentMap = {};

  classStudents.forEach((st) => {
    studentMap[st._id.toString()] = {
      studentId: st._id,
      name: st.userId?.name || "Unknown",
      registrationNumber: st.registrationNumber,
      subjects: {},
    };
  });

  semesterMarks.forEach((mark) => {
    const sId = mark.studentId.toString();
    const subId = mark.subjectId._id.toString();

    if (studentMap[sId]) {
      if (!studentMap[sId].subjects[subId]) {
        studentMap[sId].subjects[subId] = {
          subjectName: mark.subjectId.subjectName,
          subjectCode: mark.subjectId.subjectCode,
          sessionBreakdown: [],
        };
      }

      // Find session weight configured in semester
      const sessionConfig = semester.sessions.find(
        (s) => s.examSessionId.toString() === mark.examSessionId._id.toString(),
      );
      const weight = sessionConfig ? sessionConfig.weightPercentage : 0;

      // Normalize score to /20 basis
      const normalizedScore = (mark.score / mark.outOf) * 20;

      studentMap[sId].subjects[subId].sessionBreakdown.push({
        sessionName: mark.examSessionId.sessionName,
        rawScore: mark.score,
        outOf: mark.outOf,
        normalizedScore: parseFloat(normalizedScore.toFixed(2)),
        weight,
      });
    }
  });

  // Calculate final subject marks and overall averages
  const leaderboard = Object.values(studentMap).map((st) => {
    let totalSubjectMarks = 0;
    let subjectCount = 0;

    const compiledSubjects = Object.values(st.subjects).map((sub) => {
      let weightedMark = 0;
      let totalWeightApplied = 0;

      sub.sessionBreakdown.forEach((sb) => {
        weightedMark += sb.normalizedScore * (sb.weight / 100);
        totalWeightApplied += sb.weight;
      });

      // Handle unweighted or equal split fallback
      const finalSubjectMark =
        totalWeightApplied > 0
          ? weightedMark * (100 / totalWeightApplied)
          : sub.sessionBreakdown.reduce(
              (acc, curr) => acc + curr.normalizedScore,
              0,
            ) / (sub.sessionBreakdown.length || 1);

      const formattedMark = parseFloat(finalSubjectMark.toFixed(2));
      totalSubjectMarks += formattedMark;
      subjectCount++;

      return {
        ...sub,
        finalSubjectMark: formattedMark,
        grade: getGrade(formattedMark),
      };
    });

    const overallAverage =
      subjectCount > 0
        ? parseFloat((totalSubjectMarks / subjectCount).toFixed(2))
        : 0;

    return {
      studentId: st.studentId,
      name: st.name,
      registrationNumber: st.registrationNumber,
      subjects: compiledSubjects,
      overallAverage,
      overallGrade: getGrade(overallAverage),
    };
  });

  // Sort descending by overall average to assign ranks
  leaderboard.sort((a, b) => b.overallAverage - a.overallAverage);

  const totalStudents = leaderboard.length;
  leaderboard.forEach((st, idx) => {
    st.rank = idx + 1;
    st.positionRatio = `${idx + 1} / ${totalStudents}`;
  });

  return leaderboard;
};

// GET: Individual Student Report Card
export const getSemesterReportCard = async (req, res) => {
  try {
    const { studentId, semesterId } = req.params;

    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res
        .status(404)
        .json({ success: false, error: "Semester not found" });
    }

    if (req.user.role === "student" && !semester.isReportCardPublished) {
      return res.status(403).json({
        success: false,
        error:
          "Semester report cards have not been published by the administration yet.",
      });
    }

    const leaderboard = await computeClassLeaderboard(semesterId);
    const studentReport = leaderboard.find(
      (s) => s.studentId.toString() === studentId,
    );

    if (!studentReport) {
      return res.status(404).json({
        success: false,
        error: "Report card data not found for student.",
      });
    }

    return res.status(200).json({
      success: true,
      reportCard: {
        semesterName: semester.name,
        academicYear: semester.academicYear,
        isPublished: semester.isReportCardPublished,
        ...studentReport,
      },
    });
  } catch (error) {
    console.error("Report Card Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error fetching report card",
    });
  }
};

// GET: Admin Class Summary & Leaderboard
export const getClassReportCardSummary = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const leaderboard = await computeClassLeaderboard(semesterId);

    return res.status(200).json({
      success: true,
      leaderboard,
    });
  } catch (error) {
    console.error("Class Summary Error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to compile class summary" });
  }
};

// PUT: Admin Only — Publish/Unpublish Semester Report Cards
export const togglePublishReportCards = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { isPublished } = req.body;

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

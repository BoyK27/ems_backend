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
const computeClassLeaderboard = async (semesterId, targetClassId = null) => {
  const semester = await Semester.findById(semesterId);
  if (!semester) throw new Error("Semester not found");

  // Determine active class filter priority (query parameter OR semester classId)
  const activeClassId = targetClassId || semester.classId;

  // Build query for students
  const studentQuery = {};
  if (activeClassId) {
    studentQuery.$or = [{ classId: activeClassId }, { class: activeClassId }];
  }

  const classStudents = await Student.find(studentQuery).populate(
    "userId",
    "name",
  );

  // Fetch semester marks
  const semesterMarks = await Mark.find({ semesterId }).populate(
    "subjectId examSessionId studentId",
  );

  // Map students to subjects & session marks
  const studentMap = {};

  classStudents.forEach((st) => {
    const sId = st._id.toString();
    studentMap[sId] = {
      studentId: st._id,
      name: st.userId?.name || st.name || "Unknown Student",
      registrationNumber: st.registrationNumber || "N/A",
      subjects: {},
    };
  });

  semesterMarks.forEach((mark) => {
    if (!mark.studentId || !mark.subjectId) return;

    // Handle populated vs unpopulated student ID references
    const rawStudentId = mark.studentId._id
      ? mark.studentId._id.toString()
      : mark.studentId.toString();

    // Dynamically insert student if mark exists but student wasn't pre-loaded
    if (!studentMap[rawStudentId]) {
      studentMap[rawStudentId] = {
        studentId: rawStudentId,
        name: mark.studentId.name || mark.studentId.userId?.name || "Student",
        registrationNumber: mark.studentId.registrationNumber || "N/A",
        subjects: {},
      };
    }

    const subId = mark.subjectId._id
      ? mark.subjectId._id.toString()
      : mark.subjectId.toString();

    if (!studentMap[rawStudentId].subjects[subId]) {
      studentMap[rawStudentId].subjects[subId] = {
        subjectName:
          mark.subjectId.subjectName || mark.subjectId.name || "Subject",
        subjectCode:
          mark.subjectId.subjectCode || mark.subjectId.code || "SUBJ",
        sessionBreakdown: [],
      };
    }

    // Find session weight configured in semester with complete null checks
    let weight = 0;
    if (
      semester.sessions &&
      Array.isArray(semester.sessions) &&
      mark.examSessionId
    ) {
      const markSessionId = mark.examSessionId._id
        ? mark.examSessionId._id.toString()
        : mark.examSessionId.toString();

      const sessionConfig = semester.sessions.find((s) => {
        if (!s || !s.examSessionId) return false;
        const configuredSessionId = s.examSessionId._id
          ? s.examSessionId._id.toString()
          : s.examSessionId.toString();
        return configuredSessionId === markSessionId;
      });

      if (sessionConfig) {
        weight = sessionConfig.weightPercentage || 0;
      }
    }

    const outOf = mark.outOf || mark.maxScore || 20;
    const rawScore = mark.score || mark.mark || 0;

    // Normalize score to /20 basis
    const normalizedScore = outOf > 0 ? (rawScore / outOf) * 20 : 0;

    const sessionName =
      mark.examSessionId?.sessionName || mark.sessionName || "Assessment";

    studentMap[rawStudentId].subjects[subId].sessionBreakdown.push({
      sessionName,
      rawScore,
      outOf,
      normalizedScore: parseFloat(normalizedScore.toFixed(2)),
      weight,
    });
  });

  // Calculate final subject marks and overall averages
  const leaderboard = Object.values(studentMap).map((st) => {
    let totalSubjectMarks = 0;
    let subjectCount = 0;

    const compiledSubjects = Object.values(st.subjects).map((sub) => {
      let weightedMark = 0;
      let totalWeightApplied = 0;

      sub.sessionBreakdown.forEach((sb) => {
        if (sb.weight > 0) {
          weightedMark += sb.normalizedScore * (sb.weight / 100);
          totalWeightApplied += sb.weight;
        }
      });

      // Handle unweighted or equal split fallback
      const finalSubjectMark =
        totalWeightApplied > 0
          ? weightedMark * (100 / totalWeightApplied)
          : sub.sessionBreakdown.reduce(
              (acc, curr) => acc + curr.normalizedScore,
              0,
            ) / (sub.sessionBreakdown.length || 1);

      const formattedMark = parseFloat((finalSubjectMark || 0).toFixed(2));
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

    if (req.user?.role === "student" && !semester.isReportCardPublished) {
      return res.status(403).json({
        success: false,
        error:
          "Semester report cards have not been published by the administration yet.",
      });
    }

    const leaderboard = await computeClassLeaderboard(semesterId);
    const studentReport = leaderboard.find(
      (s) => s.studentId && s.studentId.toString() === studentId,
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

// GET: Class Summary & Leaderboard
export const getClassReportCardSummary = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { classId } = req.query;

    const leaderboard = await computeClassLeaderboard(semesterId, classId);

    return res.status(200).json({
      success: true,
      leaderboard,
    });
  } catch (error) {
    console.error("Class Summary Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to compile class summary",
    });
  }
};

// PUT: Publish/Unpublish Semester Report Cards
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

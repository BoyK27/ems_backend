import ExamSession from "../models/ExamSessions.js";
import Semester from "../models/Semester.js";

// Create an evaluation session and attach it to a semester
const addExamSession = async (req, res) => {
  try {
    const { sessionName, semesterId, isPublished } = req.body;

    const newSession = new ExamSession({
      sessionName,
      semesterId: semesterId || null,
      isPublished: isPublished ?? true,
    });
    await newSession.save();

    // Optionally push this sessionId into the Semester's sessions array
    if (semesterId) {
      await Semester.findByIdAndUpdate(semesterId, {
        $push: { sessions: { sessionId: newSession._id, weight: 100 } },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Exam session created successfully",
      session: newSession,
    });
  } catch (error) {
    console.error("Error creating exam session:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Server error creating exam session" });
  }
};

// Fetch all exam sessions with semester populated
const getExamSessions = async (req, res) => {
  try {
    const sessions = await ExamSession.find()
      .populate("semesterId", "name academicYear")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Server error fetching exam sessions" });
  }
};

// NEW: Get exam sessions by Semester ID (Fixes MarksEntry fetch)
const getExamSessionsBySemester = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const sessions = await ExamSession.find({ semesterId }).sort({
      createdAt: -1,
    });
    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server error fetching sessions by semester",
    });
  }
};

// Toggle result publication status
const togglePublishStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await ExamSession.findById(id);

    if (!session) {
      return res
        .status(404)
        .json({ success: false, error: "Exam session not found" });
    }

    session.isPublished = !session.isPublished;
    await session.save();

    return res.status(200).json({
      success: true,
      message: `Exam session marks ${session.isPublished ? "published" : "unpublished"}`,
      session,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server error updating publication status",
    });
  }
};

// Delete session
const deleteExamSession = async (req, res) => {
  try {
    const { id } = req.params;

    // Remove session reference from Semester schema if linked
    const session = await ExamSession.findById(id);
    if (session?.semesterId) {
      await Semester.findByIdAndUpdate(session.semesterId, {
        $pull: { sessions: { sessionId: id } },
      });
    }

    await ExamSession.findByIdAndDelete(id);
    return res
      .status(200)
      .json({ success: true, message: "Exam session deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Server error deleting exam session" });
  }
};

export {
  addExamSession,
  getExamSessions,
  getExamSessionsBySemester,
  togglePublishStatus,
  deleteExamSession,
};

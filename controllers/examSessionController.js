import mongoose from "mongoose";
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

// Fetch exam sessions (Supports optional ?semesterId query filtering)
const getExamSessions = async (req, res) => {
  try {
    const { semesterId } = req.query;
    let query = {};

    if (semesterId && semesterId !== "all") {
      if (!mongoose.Types.ObjectId.isValid(semesterId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid semesterId",
        });
      }

      const semesterObjectId = new mongoose.Types.ObjectId(semesterId);
      const semester = await Semester.findById(semesterObjectId)
        .select("sessions")
        .lean();

      const referencedSessionIds = (semester?.sessions || [])
        .map((item) => item?.sessionId?._id || item?.sessionId)
        .filter(Boolean);

      query = {
        $or: [
          { semesterId: semesterObjectId },
          { _id: { $in: referencedSessionIds } },
        ],
      };
    }

    const sessions = await ExamSession.find(query)
      .populate("semesterId", "name academicYear")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    console.error("Error fetching exam sessions:", error);
    return res.status(500).json({
      success: false,
      error: "Server error fetching exam sessions",
    });
  }
};

// Get exam sessions by Semester ID param
const getExamSessionsBySemester = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const query = semesterId !== "all" ? { semesterId } : {};

    const sessions = await ExamSession.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    console.error("Error fetching sessions by semester:", error);
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
    console.error("Error toggling publish status:", error);
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
    console.error("Error deleting exam session:", error);
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

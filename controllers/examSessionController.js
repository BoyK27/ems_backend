import ExamSession from "../models/ExamSession.js";

// Create an evaluation session
const addExamSession = async (req, res) => {
  try {
    const { sessionName, isPublished } = req.body;

    const newSession = new ExamSession({
      sessionName,
      isPublished: isPublished || false,
    });
    await newSession.save();

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

// Fetch all exam sessions
const getExamSessions = async (req, res) => {
  try {
    const sessions = await ExamSession.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Server error fetching exam sessions" });
  }
};

// Toggle result publication status (Publish / Unpublish results)
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
  togglePublishStatus,
  deleteExamSession,
};

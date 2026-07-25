import StudentLeave from "../models/StudentLeave.js";
import Student from "../models/Student.js";

// 1. Add Student Leave
const addStudentLeave = async (req, res) => {
  try {
    const { userId, leaveType, startDate, endDate, reason } = req.body;

    // Find Student record via linked User ID
    const student = await Student.findOne({ userId });

    if (!student) {
      return res
        .status(404)
        .json({ success: false, error: "Student profile not found" });
    }

    const newLeave = new StudentLeave({
      studentId: student._id,
      leaveType,
      startDate,
      endDate,
      reason,
    });

    await newLeave.save();

    return res.status(200).json({
      success: true,
      message: "Absence request submitted successfully",
    });
  } catch (error) {
    console.error("Error adding student leave:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to submit leave request",
    });
  }
};

// 2. Get Leaves for a Single Student (by User ID or Student ID)
const getStudentLeave = async (req, res) => {
  try {
    const { id, role } = req.params;
    let leaves = [];

    if (role === "admin") {
      leaves = await StudentLeave.find({ studentId: id }).sort({
        createdAt: -1,
      });
    } else {
      const student = await Student.findOne({ userId: id });
      if (!student) {
        return res
          .status(404)
          .json({ success: false, error: "Student profile not found" });
      }
      leaves = await StudentLeave.find({ studentId: student._id }).sort({
        createdAt: -1,
      });
    }

    return res.status(200).json({ success: true, leaves });
  } catch (error) {
    console.error("Error fetching student leave:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Server error fetching student leaves" });
  }
};

// 3. Get All Student Leaves (Admin Overview)
const getStudentLeaves = async (req, res) => {
  try {
    const leaves = await StudentLeave.find()
      .populate({
        path: "studentId",
        populate: [
          { path: "department", select: "dep_name" },
          { path: "userId", select: "name" },
        ],
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, leaves });
  } catch (error) {
    console.error("Error fetching all student leaves:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Server error fetching leave records" });
  }
};

// 4. Get Detailed View of a Single Leave Request
const getStudentLeaveDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await StudentLeave.findById(id).populate({
      path: "studentId",
      populate: [
        { path: "department", select: "dep_name" },
        { path: "userId", select: "name profileImage" },
      ],
    });

    if (!leave) {
      return res
        .status(404)
        .json({ success: false, error: "Absence request not found" });
    }

    return res.status(200).json({ success: true, leave });
  } catch (error) {
    console.error("Error fetching leave detail:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Server error fetching leave details" });
  }
};

// 5. Update Student Leave Status (Approve / Reject)
const updateStudentLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const leave = await StudentLeave.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    if (!leave) {
      return res
        .status(404)
        .json({ success: false, error: "Absence request not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Leave status updated successfully" });
  } catch (error) {
    console.error("Error updating leave status:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Server error updating leave status" });
  }
};

export {
  addStudentLeave,
  getStudentLeave,
  getStudentLeaves,
  getStudentLeaveDetail,
  updateStudentLeave,
};

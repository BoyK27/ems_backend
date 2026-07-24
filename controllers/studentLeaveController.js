import StudentLeave from "../models/StudentLeave.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import Department from "../models/Department.js";

// 1. Add Student Leave
const addStudentLeave = async (req, res) => {
  try {
    const { userId, leaveType, startDate, endDate, reason } = req.body;
    const student = await Student.findOne({ userId });

    if (!student) {
      return res
        .status(404)
        .json({ success: false, error: "Student not found" });
    }

    const newLeave = new StudentLeave({
      studentId: student._id,
      leaveType,
      startDate,
      endDate,
      reason,
    });

    await newLeave.save();

    return res
      .status(200)
      .json({ success: true, message: "Leave applied successfully" });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ success: false, error: "Student leave add server error" });
  }
};

// 2. Get Leaves for a single student (or by admin for specific student)
const getStudentLeave = async (req, res) => {
  try {
    const { id, role } = req.params;
    let leaves;

    if (role === "admin") {
      leaves = await StudentLeave.find({ studentId: id });
    } else {
      const student = await Student.findOne({ userId: id });
      if (!student) {
        return res
          .status(404)
          .json({ success: false, error: "Student profile not found" });
      }
      leaves = await StudentLeave.find({ studentId: student._id });
    }

    return res.status(200).json({ success: true, leaves });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ success: false, error: "Couldn't find student leaves" });
  }
};

// 3. Get all Student Leaves for Admin Overview
const getStudentLeaves = async (req, res) => {
  try {
    const leaves = await StudentLeave.find().populate({
      path: "studentId",
      populate: [
        {
          path: "department",
          select: "dep_name",
        },
        {
          path: "userId",
          select: "name",
        },
      ],
    });
    return res.status(200).json({ success: true, leaves });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ success: false, error: "Couldn't find student leaves" });
  }
};

// 4. Get detailed view of a single Student Leave request
const getStudentLeaveDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await StudentLeave.findById(id).populate({
      path: "studentId",
      populate: [
        {
          path: "department",
          select: "dep_name",
        },
        {
          path: "userId",
          select: "name profileImage",
        },
      ],
    });

    if (!leave) {
      return res
        .status(404)
        .json({ success: false, error: "Leave application not found" });
    }

    return res.status(200).json({ success: true, leave });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ success: false, error: "Couldn't find student leave detail" });
  }
};

// 5. Update Student Leave status (Approve / Reject)
const updateStudentLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await StudentLeave.findByIdAndUpdate(
      id,
      { status: req.body.status },
      { new: true },
    );

    if (!leave) {
      return res
        .status(404)
        .json({ success: false, error: "Student leave not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Leave status updated successfully" });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ success: false, error: "Couldn't update student leave status" });
  }
};

export {
  addStudentLeave,
  getStudentLeave,
  getStudentLeaves,
  getStudentLeaveDetail,
  updateStudentLeave,
};

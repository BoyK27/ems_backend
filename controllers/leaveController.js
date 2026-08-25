import mongoose from "mongoose";
import Leave from "../models/Leave.js";
import Employee from "../models/Employee.js";
import Student from "../models/Student.js"; // Import Student model if applicable

// --- Helper to resolve profile document (Employee or Student) ---
const resolveProfile = async (userId, role) => {
  const normalizedRole = (role || "").toLowerCase();

  if (normalizedRole === "student") {
    let student = await Student.findOne({ userId });
    if (!student && mongoose.Types.ObjectId.isValid(userId)) {
      student = await Student.findById(userId);
    }
    return { profile: student, type: "student" };
  }

  // Default to Employee lookup
  let employee = await Employee.findOne({ userId });
  if (!employee && mongoose.Types.ObjectId.isValid(userId)) {
    employee = await Employee.findById(userId);
  }
  return { profile: employee, type: "employee" };
};

// 1. ADD LEAVE
const addLeave = async (req, res) => {
  try {
    const { userId, role, leaveType, startDate, endDate, reason } = req.body;

    const { profile, type } = await resolveProfile(userId, role);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: `${type === "student" ? "Student" : "Employee"} profile not found`,
      });
    }

    const leaveData = {
      leaveType,
      startDate,
      endDate,
      reason,
      employeeId: type === "employee" ? profile._id : null,
      studentId: type === "student" ? profile._id : null,
    };

    const newLeave = new Leave(leaveData);
    await newLeave.save();

    return res.status(200).json({
      success: true,
      message: "Leave requested successfully",
    });
  } catch (error) {
    console.error("Error adding leave:", error.message);
    return res.status(500).json({
      success: false,
      error: "Leave add server error",
    });
  }
};

// 2. GET LEAVE (BY INDIVIDUAL USER)
const getLeave = async (req, res) => {
  try {
    const { id, role } = req.params;

    if (!id || id === "undefined" || id === "null") {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const normalizedRole = (role || "").toLowerCase();

    // If Admin, query leaves directly using id as an ObjectId
    if (normalizedRole === "admin") {
      const leaves = await Leave.find({
        $or: [{ employeeId: id }, { studentId: id }],
      }).sort({ createdAt: -1 });

      return res.status(200).json({ success: true, leaves });
    }

    // Resolve profile for Employee or Student
    const { profile, type } = await resolveProfile(id, normalizedRole);

    if (!profile) {
      return res.status(200).json({
        success: true,
        leaves: [],
      });
    }

    const queryKey = type === "student" ? "studentId" : "employeeId";
    const leaves = await Leave.find({ [queryKey]: profile._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ success: true, leaves });
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return res.status(500).json({
      success: false,
      error: "Could not find leave records",
    });
  }
};

// 3. GET ALL LEAVES (ADMIN VIEW)
const getLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "employeeId",
        populate: [
          { path: "department", select: "dep_name" },
          { path: "userId", select: "name" },
        ],
      })
      .populate({
        path: "studentId",
        populate: [{ path: "userId", select: "name" }],
      });

    return res.status(200).json({ success: true, leaves });
  } catch (error) {
    console.error("Error fetching leaves list:", error.message);
    return res.status(500).json({
      success: false,
      error: "Couldn't find leaves",
    });
  }
};

// 4. GET SINGLE LEAVE DETAIL
const getLeaveDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id)
      .populate({
        path: "employeeId",
        populate: [
          { path: "department", select: "dep_name" },
          { path: "userId", select: "name profileImage" },
        ],
      })
      .populate({
        path: "studentId",
        populate: [{ path: "userId", select: "name profileImage" }],
      });

    if (!leave) {
      return res.status(404).json({
        success: false,
        error: "Leave detail not found",
      });
    }

    return res.status(200).json({ success: true, leave });
  } catch (error) {
    console.error("Error fetching leave details:", error.message);
    return res.status(500).json({
      success: false,
      error: "Couldn't find leave detail",
    });
  }
};

// 5. UPDATE LEAVE STATUS
const updateLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findByIdAndUpdate(
      id,
      { status: req.body.status },
      { new: true },
    );

    if (!leave) {
      return res.status(404).json({
        success: false,
        error: "Leave record not found",
      });
    }

    return res.status(200).json({ success: true, leave });
  } catch (error) {
    console.error("Error updating leave:", error.message);
    return res.status(500).json({
      success: false,
      error: "Couldn't update Leave",
    });
  }
};

export { addLeave, getLeave, getLeaves, getLeaveDetail, updateLeave };

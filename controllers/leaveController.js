import Leave from "../models/Leave.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import mongoose from "mongoose";

const addLeave = async (req, res) => {
  try {
    const { userId, leaveType, startDate, endDate, reason } = req.body;

    const employee = await Employee.findOne({ userId });
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, error: "Employee profile not found" });
    }

    const newLeave = new Leave({
      employeeId: employee._id,
      leaveType,
      startDate,
      endDate,
      reason,
    });

    await newLeave.save();

    return res
      .status(200)
      .json({ success: true, message: "Leave requested successfully" });
  } catch (error) {
    console.error("Error adding leave:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Leave add server error" });
  }
};

const getLeave = async (req, res) => {
  try {
    const { id, role } = req.params;
    let leaves = [];

    if (role === "admin") {
      leaves = await Leave.find({ employeeId: id }).sort({ createdAt: -1 });
    } else {
      // Look up employee record using the User ID
      const employee = await Employee.findOne({ userId: id });
      if (!employee) {
        return res
          .status(404)
          .json({ success: false, error: "Employee not found for this user" });
      }
      leaves = await Leave.find({ employeeId: employee._id }).sort({
        createdAt: -1,
      });
    }

    return res.status(200).json({ success: true, leaves });
  } catch (error) {
    console.error("Error fetching single leave:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch leave history" });
  }
};

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
      });

    return res.status(200).json({ success: true, leaves });
  } catch (error) {
    console.error("Error fetching leaves list:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch leaves" });
  }
};

const getLeaveDetail = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid Leave ID" });
    }

    const leave = await Leave.findById(id).populate({
      path: "employeeId",
      populate: [
        { path: "department", select: "dep_name" },
        { path: "userId", select: "name profileImage" },
      ],
    });

    if (!leave) {
      return res
        .status(404)
        .json({ success: false, error: "Leave record not found" });
    }

    return res.status(200).json({ success: true, leave });
  } catch (error) {
    console.error("Error fetching leave details:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch leave details" });
  }
};

const updateLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res
        .status(400)
        .json({ success: false, error: "Status is required" });
    }

    const leave = await Leave.findByIdAndUpdate(id, { status }, { new: true });

    if (!leave) {
      return res.status(404).json({ success: false, error: "Leave not found" });
    }

    return res.status(200).json({ success: true, leave });
  } catch (error) {
    console.error("Error updating leave:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Server error updating leave status" });
  }
};

export { addLeave, getLeave, getLeaves, getLeaveDetail, updateLeave };

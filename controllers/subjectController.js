import mongoose from "mongoose";
import Subject from "../models/Subject.js";
import User from "../models/User.js";

// Add a new subject
const addSubject = async (req, res) => {
  try {
    const { subjectName, subjectCode, classId } = req.body;

    if (!subjectName || !subjectCode || !classId) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required" });
    }

    // Check if THIS SPECIFIC CLASS already has this subject code
    const existingSubject = await Subject.findOne({
      classId,
      subjectCode: subjectCode.trim(),
    });

    if (existingSubject) {
      return res.status(400).json({
        success: false,
        error: "This subject code already exists for the selected class",
      });
    }

    const newSubject = new Subject({
      subjectName: subjectName.trim(),
      subjectCode: subjectCode.trim(),
      classId,
    });

    await newSubject.save();

    const populatedSubject = await Subject.findById(newSubject._id).populate(
      "classId",
      "className code",
    );

    return res.status(201).json({
      success: true,
      message: "Subject created successfully",
      subject: populatedSubject,
    });
  } catch (error) {
    console.error("Error adding subject:", error.message);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "This subject code already exists for this class",
      });
    }
    return res
      .status(500)
      .json({ success: false, error: "Server error creating subject" });
  }
};

// Get all subjects (populates assigned class)
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find()
      .populate("classId", "className code")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, subjects });
  } catch (error) {
    console.error("Error fetching subjects:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Server error fetching subjects" });
  }
};

// Get subjects filtered by classId
const getSubjectsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const subjects = await Subject.find({ classId })
      .populate("classId", "className code")
      .sort({ subjectName: 1 });

    return res.status(200).json({ success: true, subjects });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server error fetching subjects for class",
    });
  }
};

// Update subject
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { subjectName, subjectCode, classId } = req.body;

    // Prevent duplicate subject code in the target class when updating
    if (subjectCode && classId) {
      const existing = await Subject.findOne({
        _id: { $ne: id }, // Exclude current subject
        classId,
        subjectCode: subjectCode.trim(),
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error:
            "Another subject in this class is already using this subject code",
        });
      }
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
      id,
      {
        subjectName: subjectName?.trim(),
        subjectCode: subjectCode?.trim(),
        classId,
      },
      { new: true },
    ).populate("classId", "className code");

    if (!updatedSubject) {
      return res
        .status(404)
        .json({ success: false, error: "Subject not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      subject: updatedSubject,
    });
  } catch (error) {
    console.error("Error updating subject:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Server error updating subject" });
  }
};

// Delete subject
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    await Subject.findByIdAndDelete(id);
    return res
      .status(200)
      .json({ success: true, message: "Subject deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Server error deleting subject" });
  }
};

// Get subjects assigned to the logged-in user for a specific class
const getTeacherAssignedSubjects = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized user" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // 1. If user is Admin, return all subjects registered under this class
    if (user.role === "admin") {
      const allSubjects = await Subject.find({ classId }).sort({
        subjectName: 1,
      });
      return res.status(200).json({ success: true, subjects: allSubjects });
    }

    // 2. Fetch subjects for this class filtered by the teacher's ID (if stored on Subject model)
    //    Or return all subjects for the class if teacher assignment is handled at class level
    const subjects = await Subject.find({
      classId,
      $or: [
        { teacherId: userId },
        { teacher: userId },
        { assignedTeacher: userId },
      ],
    }).sort({ subjectName: 1 });

    // Fallback: If no specific teacher field is found on Subject documents, return all subjects for the selected class
    if (subjects.length === 0) {
      const fallbackSubjects = await Subject.find({ classId }).sort({
        subjectName: 1,
      });
      return res
        .status(200)
        .json({ success: true, subjects: fallbackSubjects });
    }

    return res.status(200).json({ success: true, subjects });
  } catch (error) {
    console.error("Error fetching teacher subjects:", error.message);
    return res.status(500).json({
      success: false,
      error: "Server error fetching assigned subjects for class",
    });
  }
};

export {
  addSubject,
  getSubjects,
  getSubjectsByClass,
  updateSubject,
  deleteSubject,
  getTeacherAssignedSubjects,
};

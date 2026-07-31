import Subject from "../models/Subject.js";

// Add a new subject
const addSubject = async (req, res) => {
  try {
    const { subjectName, subjectCode, classId } = req.body;

    const existingSubject = await Subject.findOne({ subjectCode });
    if (existingSubject) {
      return res
        .status(400)
        .json({ success: false, error: "Subject code already exists" });
    }

    const newSubject = new Subject({ subjectName, subjectCode, classId });
    await newSubject.save();

    return res.status(200).json({
      success: true,
      message: "Subject created successfully",
      subject: newSubject,
    });
  } catch (error) {
    console.error("Error adding subject:", error.message);
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
    const subjects = await Subject.find({ classId }).populate(
      "classId",
      "className code",
    );
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

    const updatedSubject = await Subject.findByIdAndUpdate(
      id,
      { subjectName, subjectCode, classId },
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

export {
  addSubject,
  getSubjects,
  getSubjectsByClass,
  updateSubject,
  deleteSubject,
};

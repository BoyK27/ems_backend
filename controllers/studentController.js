import Student from "../models/Student.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import StudentLeave from "../models/StudentLeave.js";
import Attendance from "../models/Attendance.js";
import bcrypt from "bcrypt";
import path from "path";

// 1. Add New Student
const addStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      studentId,
      dob,
      gender,
      maritalStatus,
      department,
      password,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User already registered with this email",
      });
    }

    // Check if student ID is unique
    const existingStudentId = await Student.findOne({ studentId });
    if (existingStudentId) {
      return res
        .status(400)
        .json({ success: false, error: "Student ID already exists" });
    }

    // Hash Password
    const hashPassword = await bcrypt.hash(password, 10);

    // Save User Account
    const newUser = new User({
      name,
      email,
      password: hashPassword,
      role: "student",
      profileImage: req.file ? req.file.filename : "",
    });
    const savedUser = await newUser.save();

    // Save Student Profile
    const newStudent = new Student({
      userId: savedUser._id,
      studentId,
      dob,
      gender,
      maritalStatus,
      department,
    });
    await newStudent.save();

    return res
      .status(200)
      .json({ success: true, message: "Student created successfully" });
  } catch (error) {
    console.error("Error adding student:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Server error creating student" });
  }
};

// 2. Get All Students
const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate({ path: "userId", select: "-password" })
      .populate("department", "dep_name");

    return res.status(200).json({ success: true, students });
  } catch (error) {
    console.error("Error fetching students:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Server error fetching students list" });
  }
};

// 3. Get Single Student by ID (Student ID or User ID)
const getStudent = async (req, res) => {
  const { id } = req.params;
  try {
    let student;
    student = await Student.findById(id)
      .populate({ path: "userId", select: "-password" })
      .populate("department", "dep_name");

    if (!student) {
      student = await Student.findOne({ userId: id })
        .populate({ path: "userId", select: "-password" })
        .populate("department", "dep_name");
    }

    if (!student) {
      return res
        .status(404)
        .json({ success: false, error: "Student profile not found" });
    }

    return res.status(200).json({ success: true, student });
  } catch (error) {
    console.error("Error fetching student detail:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Server error fetching student" });
  }
};

// 4. Update Student Profile
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, gender, maritalStatus, dob } = req.body;

    const student = await Student.findById(id);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, error: "Student not found" });
    }

    // Update linked User name
    await User.findByIdAndUpdate(student.userId, { name });

    // Update Student attributes
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { department, gender, maritalStatus, dob },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Server error updating student" });
  }
};

// 5. Delete Student (with Cascading Cleanup)
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);

    if (!student) {
      return res
        .status(404)
        .json({ success: false, error: "Student not found" });
    }

    // Cascading deletion
    await User.findByIdAndDelete(student.userId);
    await StudentLeave.deleteMany({ studentId: id });
    await Attendance.deleteMany({ studentId: id });
    await Student.findByIdAndDelete(id);

    return res
      .status(200)
      .json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Server error deleting student" });
  }
};

// 6. Get Students by Department
const fetchStudentsByDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const students = await Student.find({ department: id })
      .populate({ path: "userId", select: "-password" })
      .populate("department", "dep_name");

    return res.status(200).json({ success: true, students });
  } catch (error) {
    console.error("Error fetching students by department:", error.message);
    return res.status(500).json({
      success: false,
      error: "Server error fetching department students",
    });
  }
};

export {
  addStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  fetchStudentsByDepartment,
};

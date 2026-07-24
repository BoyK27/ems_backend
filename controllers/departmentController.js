import Department from "../models/Department.js";
import Employee from "../models/Employee.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import Leave from "../models/Leave.js";
import StudentLeave from "../models/StudentLeave.js";
import Attendance from "../models/Attendance.js";

// 1. Get All Departments
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    return res.status(200).json({ success: true, departments });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "get department server error" });
  }
};

// 2. Add New Department
const addDepartment = async (req, res) => {
  try {
    const { dep_name, description } = req.body;
    const newDep = new Department({
      dep_name,
      description,
    });

    await newDep.save();
    return res.status(200).json({ success: true, department: newDep });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "add department server error" });
  }
};

// 3. Get Single Department by ID
const getDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findById({ _id: id });
    if (!department) {
      return res
        .status(404)
        .json({ success: false, error: "Department not found" });
    }

    return res.status(200).json({ success: true, department });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "get department server error" });
  }
};

// 4. Update Department
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { dep_name, description } = req.body;
    const updateDep = await Department.findByIdAndUpdate(
      { _id: id },
      {
        dep_name,
        description,
      },
      { new: true },
    );
    return res.status(200).json({ success: true, updateDep });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "edit department server error" });
  }
};

// 5. Delete Department (Cascading deletion for Employees & Students)
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // --- A. CLEANUP EMPLOYEES ---
    const employees = await Employee.find({ department: id });
    const empUserIds = employees.map((emp) => emp.userId);
    const empIds = employees.map((emp) => emp._id);

    if (empUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: empUserIds } });
    }
    await Leave.deleteMany({ employeeId: { $in: empIds } });
    await Attendance.deleteMany({ employeeId: { $in: empIds } });
    await Employee.deleteMany({ department: id });

    // --- B. CLEANUP STUDENTS ---
    const students = await Student.find({ department: id });
    const studentUserIds = students.map((std) => std.userId);
    const studentIds = students.map((std) => std._id);

    if (studentUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: studentUserIds } });
    }
    await StudentLeave.deleteMany({ studentId: { $in: studentIds } });
    await Attendance.deleteMany({ studentId: { $in: studentIds } });
    await Student.deleteMany({ department: id });

    // --- C. DELETE DEPARTMENT ---
    const deletedDep = await Department.findByIdAndDelete({ _id: id });

    if (!deletedDep) {
      return res
        .status(404)
        .json({ success: false, error: "Department not found" });
    }

    return res.status(200).json({
      success: true,
      message:
        "Department and all associated employees and students deleted successfully",
      deletedDep,
    });
  } catch (error) {
    console.error("Delete Department Error:", error);
    return res.status(500).json({
      success: false,
      error: "Delete department server error",
    });
  }
};

export {
  getDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment,
  addDepartment,
};
export default addDepartment;

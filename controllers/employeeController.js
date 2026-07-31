import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import Department from "../models/Department.js";

// --- Cloudinary Configuration ---
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// --- Cloudinary Storage Engine ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "employee_ms_uploads",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage: storage });

// Helper to safely parse array inputs from multipart/form-data
const parseArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  try {
    return JSON.parse(data);
  } catch {
    return data.split(",").map((item) => item.trim());
  }
};

const addEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      employeeId,
      dob,
      gender,
      maritalStatus,
      designation,
      department,
      salary,
      password,
      role,
      classes,
      subjects,
    } = req.body;

    const userExist = await User.findOne({ email });
    if (userExist) {
      return res
        .status(400)
        .json({ success: false, error: "User already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashPassword,
      role: role || "employee",
      profileImage: req.file ? req.file.path : "",
    });
    const savedUser = await newUser.save();

    // Parse classes and subjects arrays safely
    const assignedClasses = parseArray(classes);
    const assignedSubjects = parseArray(subjects);

    const newEmployee = new Employee({
      userId: savedUser._id,
      employeeId,
      dob,
      gender,
      maritalStatus,
      designation,
      department,
      salary,
      classes: assignedClasses,
      subjects: assignedSubjects,
    });

    await newEmployee.save();
    return res
      .status(200)
      .json({ success: true, message: "Employee created successfully" });
  } catch (error) {
    console.error("Error adding employee:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("userId", { password: 0 })
      .populate("department")
      .populate("classes")
      .populate("subjects");

    return res.status(200).json({ success: true, employees });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "get employee server error" });
  }
};

const getEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    let employee = await Employee.findById(id)
      .populate("userId", { password: 0 })
      .populate("department")
      .populate("classes")
      .populate("subjects");

    if (!employee) {
      employee = await Employee.findOne({ userId: id })
        .populate("userId", { password: 0 })
        .populate("department")
        .populate("classes")
        .populate("subjects");
    }

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, error: "Employee profile not found" });
    }

    return res.status(200).json({ success: true, employee });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "get employee server error" });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      maritalStatus,
      designation,
      department,
      salary,
      classes,
      subjects,
    } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, error: "Employee not found" });
    }

    const user = await User.findById(employee.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (name) {
      await User.findByIdAndUpdate(employee.userId, { name });
    }

    const updatedEmployeeFields = {
      maritalStatus,
      designation,
      salary,
      department,
    };

    if (classes !== undefined) {
      updatedEmployeeFields.classes = parseArray(classes);
    }
    if (subjects !== undefined) {
      updatedEmployeeFields.subjects = parseArray(subjects);
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { $set: updatedEmployeeFields },
      { new: true },
    )
      .populate("userId", { password: 0 })
      .populate("department")
      .populate("classes")
      .populate("subjects");

    return res.status(200).json({
      success: true,
      message: "Employee Updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "update employees server error" });
  }
};

const fetchEmployeeByDepId = async (req, res) => {
  const { id } = req.params;
  try {
    const employees = await Employee.find({ department: id })
      .populate("userId", { password: 0 })
      .populate("classes")
      .populate("subjects");

    return res.status(200).json({ success: true, employees });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "get employeesByDepId server error" });
  }
};

export {
  upload,
  addEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  fetchEmployeeByDepId,
};

export default addEmployee;

import mongoose from "mongoose";
import Employee from "./Employee.js";
import Student from "./Student.js";
import Leave from "./Leave.js";
import StudentLeave from "./StudentLeave.js";
import Salary from "./Salary.js";
import Attendance from "./Attendance.js";

const departmentSchema = new mongoose.Schema(
  {
    dep_name: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true },
);

departmentSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    try {
      // 1. Cascading cleanup for Employees
      const employees = await Employee.find({ department: this._id });
      const empIds = employees.map((emp) => emp._id);

      await Employee.deleteMany({ department: this._id });
      await Leave.deleteMany({ employeeId: { $in: empIds } });
      await Salary.deleteMany({ employeeId: { $in: empIds } });
      await Attendance.deleteMany({ employeeId: { $in: empIds } });

      // 2. Cascading cleanup for Students
      const students = await Student.find({ department: this._id });
      const studentIds = students.map((std) => std._id);

      await Student.deleteMany({ department: this._id });
      await StudentLeave.deleteMany({ studentId: { $in: studentIds } });
      await Attendance.deleteMany({ studentId: { $in: studentIds } });

      next();
    } catch (error) {
      next(error);
    }
  },
);

const Department = mongoose.model("Department", departmentSchema);

export default Department;

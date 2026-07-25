import Employee from "../models/Employee.js";
import Student from "../models/Student.js"; // 1. Added Student model import
import Department from "../models/Department.js";
import Leave from "../models/Leave.js";
import Salary from "../models/Salary.js";

const getSummary = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const totalStudents = await Student.countDocuments(); // 2. Count total students
    const totalDepartments = await Department.countDocuments();

    const totalSalaries = await Employee.aggregate([
      { $group: { _id: null, total: { $sum: "$salary" } } },
    ]);

    const employeeAppliedForLeaves = await Leave.distinct("employeeId");

    const leaveStatus = await Leave.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const leaveSummary = {
      appliedFor: employeeAppliedForLeaves.length,
      approved: leaveStatus.find((item) => item._id === "Approved")?.count || 0,
      rejected: leaveStatus.find((item) => item._id === "Rejected")?.count || 0,
      pending: leaveStatus.find((item) => item._id === "Pending")?.count || 0,
    };

    // 3. Returned totalStudents in the response payload
    return res.status(200).json({
      success: true,
      totalEmployees,
      totalStudents,
      totalDepartments,
      totalSalaries: totalSalaries[0]?.total || 0,
      leaveSummary,
    });
  } catch (error) {
    console.error("Dashboard Summary Error:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Dashboard summary server error" });
  }
};

export { getSummary };

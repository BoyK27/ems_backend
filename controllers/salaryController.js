import Salary from "../models/Salary.js";
import Employee from "../models/Employee.js";
import mongoose from "mongoose";

const addSalary = async (req, res) => {
  try {
    const { employeeId, basicSalary, allowances, deductions, payDate } =
      req.body;

    const totalSalary =
      parseInt(basicSalary) + parseInt(allowances) - parseInt(deductions);

    const newSalary = new Salary({
      employeeId,
      basicSalary,
      allowances,
      deductions,
      netSalary: totalSalary,
      payDate,
    });

    await newSalary.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Salary add server error" });
  }
};

const getSalary = async (req, res) => {
  try {
    const { id, role } = req.params;
    let salary;
    if (role === "admin") {
      salary = await Salary.find({ employeeId: id }).populate(
        "employeeId",
        "employeeId"
      );
    } else {
      const employee = await Employee.findOne({ userId: id });
      salary = await Salary.find({ employeeId: employee._id }).populate(
        "employeeId",
        "employeeId"
      );
    }
    return res.status(200).json({ success: true, salary });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Slary get server error" });
  }
};

/*

// ... (addSalary function remains the same)

const getSalary = async (req, res) => {
  try {
    const { id: userId } = req.params;

    // --- FIX: VALIDATE THE INCOMING ID ---
    // If the userId is not a valid MongoDB ObjectId, do not proceed.
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      // This prevents the CastError crash.
      return res
        .status(400)
        .json({ success: false, error: "Invalid user ID format." });
    }

    // Now we know userId is a valid format, so we can safely query.
    const employee = await Employee.findOne({ userId: userId });

    if (!employee) {
      return res.status(200).json({ success: true, salary: [] });
    }

    const salaryRecords = await Salary.find({
      employeeId: employee._id,
    }).populate("employeeId", "employeeId");

    return res.status(200).json({ success: true, salary: salaryRecords });
  } catch (error) {
    console.error("Server Error in getSalary:", error);
    return res
      .status(500)
      .json({ success: false, error: "Salary get server error" });
  }
};

*/

export { addSalary, getSalary };

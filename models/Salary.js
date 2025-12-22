import mongoose from "mongoose";
import { Schema } from "mongoose";

const salarySchema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
  basicSalary: { type: Number, required: true },
  allowances: { type: Number },
  deductions: { type: Number },
  netSalary: { type: Number },
  payDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  UpdatedAt: { type: Date, default: Date.now },
});

const Salary = mongoose.model("salary", salarySchema);

export default Salary;

import mongoose from "mongoose";
import { Schema } from "mongoose";

const leaveSchema = new Schema(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
    leaveType: {
      type: String,
      enum: [
        "Sick Leave",
        "Casual Leave",
        "Annual Leave",
        "Medical Leave",
        "Exam Permission",
      ],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

const Leave = mongoose.model("Leave", leaveSchema);
export default Leave;

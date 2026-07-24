import mongoose from "mongoose";
import { Schema } from "mongoose";

const studentLeaveSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
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
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

const StudentLeave = mongoose.model("StudentLeave", studentLeaveSchema);
export default StudentLeave;

import mongoose from "mongoose";
import { Schema } from "mongoose";

const studentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
    },
    form: {
      type: String, // e.g., "Form 1", "Form 4", "Lower Sixth"
    },
    stream: {
      type: String, // e.g., "Branch A", "Arts", "Science"
    },
    level: {
      type: String, // e.g., "100", "200", "300"
    },
    program: {
      type: String, // e.g., "Software Engineering"
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
  },
  { timestamps: true },
);

const Student = mongoose.model("Student", studentSchema);
export default Student;

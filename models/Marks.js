import mongoose from "mongoose";

const markSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    examSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamSession",
      required: true,
    },
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    outOf: {
      type: Number,
      required: true,
      default: 20,
      min: 1,
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
  },
  { timestamps: true },
);

// Ensures a student gets one mark per subject per exam session per semester
markSchema.index(
  { studentId: 1, subjectId: 1, examSessionId: 1, semesterId: 1 },
  { unique: true },
);

export default mongoose.model("Mark", markSchema);

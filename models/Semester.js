import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "First Semester", "Term 1"
    academicYear: { type: String, required: true, default: "2025/2026" },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    sessions: [
      {
        sessionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ExamSession",
          required: true,
        },
        weight: { type: Number, default: 100 }, // Percentage weight e.g., 30 for CA, 70 for Final
      },
    ],
    isReportCardPublished: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("Semester", semesterSchema);

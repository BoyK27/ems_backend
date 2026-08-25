import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    academicYear: { type: String, required: true },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    sessions: [
      {
        examSessionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ExamSession",
        },
        weight: { type: Number, required: true, default: 50 },
      },
    ],
    isReportCardPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("Semester", semesterSchema);

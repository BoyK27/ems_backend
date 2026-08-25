import mongoose from "mongoose";

const examSessionSchema = new mongoose.Schema(
  {
    sessionName: { type: String, required: true }, // e.g., CA 1, Mid-Term, Final Exam
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: false,
    },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("ExamSession", examSessionSchema);

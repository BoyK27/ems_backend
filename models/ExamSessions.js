import mongoose from "mongoose";

const examSessionSchema = new mongoose.Schema(
  {
    sessionName: { type: String, required: true },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("ExamSession", examSessionSchema);

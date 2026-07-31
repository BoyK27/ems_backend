import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    subjectName: { type: String, required: true },
    subjectCode: { type: String, required: true /*unique: true*/ },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Subject", subjectSchema);

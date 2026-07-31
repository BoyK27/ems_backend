import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    subjectCode: {
      type: String,
      required: true,
      trim: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
  },
  { timestamps: true },
);

// Compound Index: Ensures subjectCode is unique PER CLASS, not globally
subjectSchema.index({ classId: 1, subjectCode: 1 }, { unique: true });

export default mongoose.model("Subject", subjectSchema);

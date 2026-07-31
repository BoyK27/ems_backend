import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    className: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

export default mongoose.model("Class", classSchema);

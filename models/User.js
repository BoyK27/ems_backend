import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "employee", "student"], // Added "student" role
      required: true,
    },
    profileImage: {
      type: String,
    },
  },
  {
    timestamps: true, // Automatically manages `createdAt` and `updatedAt` fields correctly
  },
);

const User = mongoose.model("User", userSchema);
export default User;

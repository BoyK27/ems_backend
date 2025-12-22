import e from "express";
import User from "../models/User.js";
import bcrpt from "bcrypt";

const changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    const user = await User.findById({ _id: userId });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const isMatch = bcrpt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(404)
        .json({ success: false, error: "Old password is incorrect" });
    }

    const hashedPassword = await bcrpt.hash(newPassword, 10);
    const newUser = await User.findByIdAndUpdate(
      { _id: userId },
      { password: hashedPassword },
      { new: true }
    );
    return res.status(200).json({ success: true, data: newUser });
  } catch (error) {
    res.status(500).json({ success: false, error: "Setting Error" });
  }
};

export { changePassword };

import Class from "../models/Class.js";
import User from "../models/User.js";

// Add a new class
const addClass = async (req, res) => {
  try {
    const { className, code } = req.body;

    const existingClass = await Class.findOne({ code });
    if (existingClass) {
      return res
        .status(400)
        .json({ success: false, error: "Class code already exists" });
    }

    const newClass = new Class({ className, code });
    await newClass.save();

    return res.status(200).json({
      success: true,
      message: "Class created successfully",
      class: newClass,
    });
  } catch (error) {
    console.error("Error adding class:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Server error creating class" });
  }
};

// Get all classes
const getClasses = async (req, res) => {
  try {
    const classes = await Class.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, classes });
  } catch (error) {
    console.error("Error fetching classes:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Server error fetching classes" });
  }
};

// Get assigned classes for the logged-in user
const getAssignedClasses = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized access" });
    }

    const user = await User.findById(userId);

    // If User is admin, return all classes
    if (user && user.role === "admin") {
      const allClasses = await Class.find().sort({ className: 1 });
      return res.status(200).json({ success: true, classes: allClasses });
    }

    // Query assigned classes or fallback to all classes if assignments aren't filtered by user
    let assignedClasses = await Class.find({
      $or: [
        { teacherId: userId },
        { teacher: userId },
        { assignedTeacher: userId },
        { _id: { $in: user?.assignedClasses || [] } },
      ],
    }).sort({ className: 1 });

    if (assignedClasses.length === 0) {
      assignedClasses = await Class.find().sort({ className: 1 });
    }

    return res.status(200).json({ success: true, classes: assignedClasses });
  } catch (error) {
    console.error("Error fetching assigned classes:", error.message);
    return res.status(500).json({
      success: false,
      error: "Server error fetching assigned classes",
    });
  }
};

// Get single class by ID
const getClass = async (req, res) => {
  try {
    const { id } = req.params;
    const singleClass = await Class.findById(id);
    if (!singleClass) {
      return res.status(404).json({ success: false, error: "Class not found" });
    }
    return res.status(200).json({ success: true, class: singleClass });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Server error fetching class detail" });
  }
};

// Update class
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { className, code } = req.body;

    const updatedClass = await Class.findByIdAndUpdate(
      id,
      { className, code },
      { new: true },
    );

    if (!updatedClass) {
      return res.status(404).json({ success: false, error: "Class not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Class updated successfully",
      class: updatedClass,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Server error updating class" });
  }
};

// Delete class
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    await Class.findByIdAndDelete(id);
    return res
      .status(200)
      .json({ success: true, message: "Class deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Server error deleting class" });
  }
};

export {
  addClass,
  getClasses,
  getAssignedClasses,
  getClass,
  updateClass,
  deleteClass,
};

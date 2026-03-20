import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

const getAttendance = async (req, res) => {
  try {
    const date = new Date().toISOString().split("T")[0];
    const employees = await Employee.find({});

    // Sync active employees with attendance table for today
    await Promise.all(
      employees.map(async (emp) => {
        const existingRecord = await Attendance.findOne({
          employeeId: emp._id,
          date: date,
        });

        if (!existingRecord) {
          await Attendance.create({
            employeeId: emp._id,
            date: date,
            status: null,
          });
        }
      }),
    );

    const attendance = await Attendance.find({ date }).populate({
      path: "employeeId",
      populate: ["department", "userId"],
    });

    const validAttendance = attendance.filter((att) => att.employeeId !== null);
    res.status(200).json({ success: true, attendance: validAttendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params; // This is the MongoDB _id from your frontend Helper
    const { status } = req.body;
    const date = new Date().toISOString().split("T")[0];

    // FIX: Update directly using the employeeId (_id) passed from the frontend
    // You don't need Employee.findOne because we are already passing the _id
    const attendanceRecord = await Attendance.findOneAndUpdate(
      { employeeId: employeeId, date },
      { status },
      { new: true },
    );

    if (!attendanceRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance record not found" });
    }

    res.status(200).json({ success: true, attendanceRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const attenddanceReport = async (req, res) => {
  try {
    const { date, limit = 5, skip = 0 } = req.query;
    const query = date ? { date } : {};

    const attendanceData = await Attendance.find(query)
      .populate({
        path: "employeeId",
        populate: ["department", "userId"],
      })
      .sort({ date: -1 });

    const groupData = attendanceData.reduce((result, record) => {
      // FIX: Guard against null employeeId to prevent crash
      if (!record.employeeId) return result;

      if (!result[record.date]) {
        result[record.date] = [];
      }

      result[record.date].push({
        employeeId: record.employeeId.employeeId,
        employeeName: record.employeeId.userId?.name || "Unknown",
        departmentName: record.employeeId.department?.dep_name || "N/A",
        status: record.status || "Not Marked",
      });
      return result;
    }, {});

    return res.status(200).json({ success: true, groupData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { getAttendance, updateAttendance, attenddanceReport };

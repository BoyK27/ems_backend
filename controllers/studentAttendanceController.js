import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";

// 1. Mark / Update Attendance for a single student or batch
const updateStudentAttendance = async (req, res) => {
  try {
    const { studentId, status, date } = req.body;
    const attendanceDate = date || new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    let attendance = await Attendance.findOne({
      studentId,
      date: attendanceDate,
    });

    if (attendance) {
      attendance.status = status;
      await attendance.save();
    } else {
      attendance = new Attendance({
        studentId,
        date: attendanceDate,
        status,
      });
      await attendance.save();
    }

    return res.status(200).json({
      success: true,
      message: "Student attendance updated successfully",
      attendance,
    });
  } catch (error) {
    console.error("Error updating student attendance:", error.message);
    return res.status(500).json({
      success: false,
      error: "Server error updating student attendance",
    });
  }
};

// 2. Batch Update Student Attendance (e.g., submitting an entire classroom's attendance sheet)
const batchUpdateStudentAttendance = async (req, res) => {
  try {
    const { date, attendanceData } = req.body; // attendanceData = [{ studentId, status }]
    const attendanceDate = date || new Date().toISOString().split("T")[0];

    const bulkOperations = attendanceData.map((item) => ({
      updateOne: {
        filter: { studentId: item.studentId, date: attendanceDate },
        update: { $set: { status: item.status } },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(bulkOperations);

    return res
      .status(200)
      .json({ success: true, message: "Batch attendance saved successfully" });
  } catch (error) {
    console.error("Error batch updating attendance:", error.message);
    return res.status(500).json({
      success: false,
      error: "Server error updating batch attendance",
    });
  }
};

// 3. Get Student Attendance Records for a Specific Date
const getStudentAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date || new Date().toISOString().split("T")[0];

    const attendance = await Attendance.find({
      date: queryDate,
      studentId: { $ne: null },
    }).populate({
      path: "studentId",
      populate: [
        { path: "userId", select: "name" },
        { path: "department", select: "dep_name" },
      ],
    });

    return res.status(200).json({ success: true, attendance, date: queryDate });
  } catch (error) {
    console.error("Error fetching attendance by date:", error.message);
    return res.status(500).json({
      success: false,
      error: "Server error fetching attendance by date",
    });
  }
};

// 4. Get Single Student's Attendance History (for Student Dashboard / Attendance tab)
const getStudentAttendanceHistory = async (req, res) => {
  try {
    const { id } = req.params; // Can be Student _id or User _id

    let student = await Student.findById(id);
    if (!student) {
      student = await Student.findOne({ userId: id });
    }

    if (!student) {
      return res
        .status(404)
        .json({ success: false, error: "Student profile not found" });
    }

    const records = await Attendance.find({ studentId: student._id }).sort({
      date: -1,
    });

    // Calculate Summary Statistics
    const summary = {
      present: records.filter((r) => r.status === "Present").length,
      absent: records.filter((r) => r.status === "Absent").length,
      sick: records.filter((r) => r.status === "Sick").length,
      leave: records.filter((r) => r.status === "Leave").length,
      total: records.length,
    };

    return res.status(200).json({ success: true, records, summary });
  } catch (error) {
    console.error("Error fetching student attendance history:", error.message);
    return res.status(500).json({
      success: false,
      error: "Server error fetching student attendance history",
    });
  }
};

// 5. Generate Department Attendance Report for Admin
const getDepartmentAttendanceReport = async (req, res) => {
  try {
    const { departmentId, date } = req.query;

    const queryFilter = { studentId: { $ne: null } };
    if (date) queryFilter.date = date;

    const rawRecords = await Attendance.find(queryFilter).populate({
      path: "studentId",
      populate: [
        { path: "userId", select: "name" },
        { path: "department", select: "dep_name" },
      ],
    });

    // Filter by department if supplied
    const filteredRecords = departmentId
      ? rawRecords.filter(
          (rec) => rec.studentId?.department?._id.toString() === departmentId,
        )
      : rawRecords;

    return res.status(200).json({ success: true, report: filteredRecords });
  } catch (error) {
    console.error("Error generating attendance report:", error.message);
    return res.status(500).json({
      success: false,
      error: "Server error generating attendance report",
    });
  }
};

export {
  updateStudentAttendance,
  batchUpdateStudentAttendance,
  getStudentAttendanceByDate,
  getStudentAttendanceHistory,
  getDepartmentAttendanceReport,
};

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectToDatabase from "./db/db.js";

// Routes imports...
import authRouter from "./routes/auth.js";
import departmentRouter from "./routes/department.js";
import employeeRouter from "./routes/employee.js";
import salaryRouter from "./routes/salary.js";
import leaveRouter from "./routes/leave.js";
import settingRouter from "./routes/setting.js";
import dashboardRouter from "./routes/dashboard.js";
import attendanceRouter from "./routes/attendance.js";

import studentRouter from "./routes/student.js";
import studentLeaveRouter from "./routes/studentLeave.js";
import studentAttendanceRouter from "./routes/studentAttendance.js";

import classRouter from "./routes/class.js";
import subjectRouter from "./routes/subjects.js";
import examSessionRouter from "./routes/examSession.js";
import markRouter from "./routes/mark.js";
import reportCardRouter from "./routes/reportCard.js";
import semesterRouter from "./routes/semesterRoute.js";

import Subject from "./models/Subject.js";

dotenv.config();

const app = express();

// Disable ETags to prevent Vercel 304 cache hits
app.set("etag", false);

app.use(
  cors({
    origin: ["https://m-ochard.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Pragma",
      "Expires",
    ],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.static("public/uploads"));

// Middleware to set Anti-Caching Headers globally
app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

// Middleware to guarantee DB connection per serverless request
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();

    if (mongoose.connection.readyState === 1) {
      Subject.collection
        .dropIndex("subjectCode_1")
        .then(() =>
          console.log("Successfully dropped stale subjectCode_1 index!"),
        )
        .catch((err) => {
          if (err.code !== 27) {
            console.log("Index status:", err.message);
          }
        });
    }

    next();
  } catch (error) {
    console.error("Database connection failed:", error);
    res
      .status(500)
      .json({ success: false, error: "Database Connection Failed" });
  }
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/department", departmentRouter);
app.use("/api/employee", employeeRouter);
app.use("/api/salary", salaryRouter);
app.use("/api/leave", leaveRouter);
app.use("/api/setting", settingRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/dashboard", dashboardRouter);

app.use("/api/student", studentRouter);
app.use("/api/student-leave", studentLeaveRouter);
app.use("/api/student-attendance", studentAttendanceRouter);
app.use("/api/report-card", reportCardRouter);

app.use("/api/class", classRouter);
app.use("/api/subject", subjectRouter);
app.use("/api/exam-session", examSessionRouter);
app.use("/api/semester", semesterRouter);
app.use("/api/mark", markRouter);

export default app;

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

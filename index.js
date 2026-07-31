import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectToDatabase from "./db/db.js";

// Existing Routes
import authRouter from "./routes/auth.js";
import departmentRouter from "./routes/department.js";
import employeeRouter from "./routes/employee.js";
import salaryRouter from "./routes/salary.js";
import leaveRouter from "./routes/leave.js";
import settingRouter from "./routes/setting.js";
import dashboardRouter from "./routes/dashboard.js";
import attendanceRouter from "./routes/attendance.js";

// New Student Routes
import studentRouter from "./routes/student.js";
import studentLeaveRouter from "./routes/studentLeave.js";
import studentAttendanceRouter from "./routes/studentAttendance.js";

// NEW ACADEMIC FEATURE ROUTES
import classRouter from "./routes/class.js";
import subjectRouter from "./routes/subjects.js";
import examSessionRouter from "./routes/examSession.js";
import markRouter from "./routes/mark.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "https://m-ochard.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.static("public/uploads"));

connectToDatabase();

// Existing Routes
app.use("/api/auth", authRouter);
app.use("/api/department", departmentRouter);
app.use("/api/employee", employeeRouter);
app.use("/api/salary", salaryRouter);
app.use("/api/leave", leaveRouter);
app.use("/api/setting", settingRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/dashboard", dashboardRouter);

// New Student Routes
app.use("/api/student", studentRouter);
app.use("/api/student-leave", studentLeaveRouter);
app.use("/api/student-attendance", studentAttendanceRouter);

// Registering New Academic Endpoints
app.use("/api/class", classRouter);
app.use("/api/subject", subjectRouter);
app.use("/api/exam-session", examSessionRouter);
app.use("/api/mark", markRouter);

export default app;

// Handle the "Listen" logic for local development only
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

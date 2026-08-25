import mongoose from "mongoose";
import dotenv from "dotenv";
import Semester from "../models/Semester.js";
import ExamSession from "../models/ExamSessions.js";

dotenv.config();

const repairData = async () => {
  try {
    if (!process.env.MONGODB_URL) {
      throw new Error("MONGODB_URL environment variable is missing.");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URL);

    const semesters = await Semester.find().lean();
    let updatedCount = 0;

    for (const sem of semesters) {
      if (sem.sessions && sem.sessions.length > 0) {
        const sessionIds = sem.sessions.map((s) => s.sessionId).filter(Boolean);

        const result = await ExamSession.updateMany(
          {
            _id: { $in: sessionIds },
            $or: [{ semesterId: { $exists: false } }, { semesterId: null }],
          },
          { $set: { semesterId: sem._id } },
        );

        updatedCount += result.modifiedCount;
      }
    }

    console.log(
      `Database repair complete. Updated ${updatedCount} exam session records.`,
    );
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

repairData();

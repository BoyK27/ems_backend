import User from "./models/User.js";
import bcrypt from "bcrypt";
import connectToDatabase from "./db/db.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const userRegister = async () => {
  await connectToDatabase();

  try {
    const hashPassword = await bcrypt.hash("glaine#Man", 10);
    const newUser = new User({
      name: "Admin",
      email: "brodev@gmail.com",
      password: hashPassword,
      role: "admin",
    });

    await newUser.save();
    console.log("Admin user created successfully in Atlas!");
  } catch (error) {
    console.log("Error seeding database:", error);
  } finally {
    mongoose.connection.close();
    console.log("Connection closed.");
    process.exit(0);
  }
};

userRegister();

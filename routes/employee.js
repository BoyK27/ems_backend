import express from "express";
import authmiddleware from "../middleware/authmiddleware.js";
import {
  addEmployee, // Consolidated here
  upload,
  getEmployees,
  getEmployee,
  updateEmployee,
  fetchEmployeeByDepId,
} from "../controllers/employeeController.js";

const router = express.Router();

router.get("/", authmiddleware, getEmployees);

router.post("/add", authmiddleware, upload.single("image"), addEmployee);

router.get("/:id", authmiddleware, getEmployee);

router.put("/:id", authmiddleware, updateEmployee);

router.get("/department/:id", authmiddleware, fetchEmployeeByDepId);

export default router;

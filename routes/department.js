import express from "express";
import authmiddleware from "../middleware/authmiddleware.js";
import addDepartment from "../controllers/departmentController.js";
import {
  getDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controllers/departmentController.js";

const router = express.Router();

router.get("/", authmiddleware, getDepartments);
router.post("/add", authmiddleware, addDepartment);
router.get("/:id", authmiddleware, getDepartment);
router.put("/:id", authmiddleware, updateDepartment);
router.delete("/:id", authmiddleware, deleteDepartment);

export default router;

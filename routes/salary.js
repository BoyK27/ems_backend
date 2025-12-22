import express from "express";
import authmiddleware from "../middleware/authmiddleware.js";
import { addSalary, getSalary } from "../controllers/salaryController.js";

const router = express.Router();

router.post("/add", authmiddleware, addSalary);
router.get("/:id/:role", authmiddleware, getSalary);

export default router;

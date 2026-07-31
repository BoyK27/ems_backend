import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import {
  addClass,
  getClasses,
  getClass,
  updateClass,
  deleteClass,
} from "../controllers/classContrller.js";

const router = express.Router();

router.post("/add", authMiddleware, addClass);
router.get("/", authMiddleware, getClasses);
router.get("/:id", authMiddleware, getClass);
router.put("/:id", authMiddleware, updateClass);
router.delete("/:id", authMiddleware, deleteClass);

export default router;

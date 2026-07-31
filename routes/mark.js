import {
  submitOrUpdateMarks,
  getMarksByClassAndSubject,
  getStudentMarks,
} from "../controllers/markController.js";

import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/save", authMiddleware, submitOrUpdateMarks);
router.get("/class-subject", authMiddleware, getMarksByClassAndSubject);
router.get("/student/:studentId", authMiddleware, getStudentMarks);
router.get(
  "/student/:studentId/:examSessionId",
  authMiddleware,
  getStudentMarks,
);

export default router;

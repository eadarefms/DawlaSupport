import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { updateMyStudentProfile, updateMyTeacherProfile } from "../controllers/profile.controller";

const router = Router();

router.use(requireAuth);
router.patch("/student", requireRole("STUDENT"), updateMyStudentProfile);
router.patch("/teacher", requireRole("TEACHER"), updateMyTeacherProfile);

export default router;

import { Router } from "express";
import { requireAuth, requireRole, scopeToProvince } from "../middleware/auth.middleware";
import { exportMyBeneficiaries, exportTeachers, exportStudents, exportSessions } from "../controllers/export.controller";
import { generateWeeklySchedulePdf } from "../controllers/export.pdf.controller";
import { generateWeeklyScheduleWord } from "../controllers/export.word.controller";

const router = Router();

router.use(requireAuth);

router.get("/beneficiaries.xlsx", requireRole("TEACHER"), exportMyBeneficiaries);
router.get(
  "/teachers.xlsx",
  requireRole("PROVINCIAL_COORDINATOR", "REGIONAL_HEAD", "ADMIN"),
  scopeToProvince,
  exportTeachers
);
router.get(
  "/students.xlsx",
  requireRole("PROVINCIAL_COORDINATOR", "REGIONAL_HEAD", "ADMIN"),
  scopeToProvince,
  exportStudents
);
router.get(
  "/sessions.xlsx",
  requireRole("PROVINCIAL_COORDINATOR", "REGIONAL_HEAD", "ADMIN"),
  scopeToProvince,
  exportSessions
);
router.get(
  "/weekly-schedule.pdf",
  requireRole("PROVINCIAL_COORDINATOR", "REGIONAL_HEAD", "ADMIN"),
  scopeToProvince,
  generateWeeklySchedulePdf
);
router.get(
  "/weekly-schedule.docx",
  requireRole("PROVINCIAL_COORDINATOR", "REGIONAL_HEAD", "ADMIN"),
  scopeToProvince,
  generateWeeklyScheduleWord
);

export default router;

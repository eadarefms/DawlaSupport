import { Router } from "express";
import { requireAuth, requireRole, scopeToProvince } from "../middleware/auth.middleware";
import {
  getTeacherDashboard,
  getProvinceDashboard,
  getRegionalDashboard,
} from "../controllers/dashboard.controller";

const router = Router();

router.use(requireAuth);
router.get("/teacher", requireRole("TEACHER"), getTeacherDashboard);
router.get(
  "/province",
  requireRole("PROVINCIAL_COORDINATOR", "REGIONAL_HEAD", "ADMIN"),
  scopeToProvince,
  getProvinceDashboard
);
router.get("/regional", requireRole("REGIONAL_HEAD", "ADMIN"), getRegionalDashboard);

export default router;

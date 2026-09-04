import { Router } from "express";
import { requireAuth, requireRole, scopeToProvince } from "../middleware/auth.middleware";
import { getMyHoursSummary, listEligibleTeachers } from "../controllers/hours.controller";

const router = Router();

router.use(requireAuth);
router.get("/mine", requireRole("TEACHER"), getMyHoursSummary);
router.get(
  "/eligible-teachers",
  requireRole("PROVINCIAL_COORDINATOR", "REGIONAL_HEAD", "ADMIN"),
  scopeToProvince,
  listEligibleTeachers
);

export default router;

import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { getSettings, updateSettings, createSchoolYear } from "../controllers/settings.controller";

const router = Router();

router.use(requireAuth);
router.get("/", getSettings);
router.put("/", requireRole("ADMIN"), updateSettings);
router.post("/school-years", requireRole("ADMIN"), createSchoolYear);

export default router;

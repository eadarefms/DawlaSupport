import { Router } from "express";
import { requireAuth, scopeToProvince } from "../middleware/auth.middleware";
import { getWeeklySchedule } from "../controllers/schedule.controller";

const router = Router();

router.use(requireAuth);
router.get("/weekly", scopeToProvince, getWeeklySchedule);

export default router;

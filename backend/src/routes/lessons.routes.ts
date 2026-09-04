import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { listAvailableLessons } from "../controllers/enrollment.controller";

const router = Router();

router.use(requireAuth);
router.get("/available", requireRole("STUDENT"), listAvailableLessons);

export default router;

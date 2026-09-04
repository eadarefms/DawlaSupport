import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { listMyBeneficiaries } from "../controllers/enrollment.controller";

const router = Router();

router.use(requireAuth);
router.get("/mine", requireRole("TEACHER"), listMyBeneficiaries);

export default router;

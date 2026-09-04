import { Router } from "express";
import { requireAuth, requireRole, scopeToProvince } from "../middleware/auth.middleware";
import { listTeachersDirectory, listStudentsDirectory } from "../controllers/directory.controller";

const router = Router();

router.use(requireAuth);
router.get(
  "/teachers",
  requireRole("PROVINCIAL_COORDINATOR", "REGIONAL_HEAD", "ADMIN"),
  scopeToProvince,
  listTeachersDirectory
);
router.get(
  "/students",
  requireRole("PROVINCIAL_COORDINATOR", "REGIONAL_HEAD", "ADMIN"),
  scopeToProvince,
  listStudentsDirectory
);

export default router;

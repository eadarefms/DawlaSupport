import { Router } from "express";
import { requireAuth, requireRole, scopeToProvince } from "../middleware/auth.middleware";
import {
  proposeSession,
  checkConflict,
  listSessions,
  getMySchedule,
  updateSessionStatus,
  updateMeetingLink,
} from "../controllers/session.controller";
import { enrollInSession, listSessionStudents } from "../controllers/enrollment.controller";

const router = Router();

router.use(requireAuth);

router.post("/", requireRole("TEACHER"), proposeSession);
router.post("/check-conflict", requireRole("TEACHER"), checkConflict);
router.get("/mine", requireRole("TEACHER", "STUDENT"), getMySchedule);
router.get(
  "/",
  requireRole("TEACHER", "PROVINCIAL_COORDINATOR", "REGIONAL_HEAD", "ADMIN"),
  scopeToProvince,
  listSessions
);
router.patch(
  "/:id/status",
  requireRole("PROVINCIAL_COORDINATOR", "REGIONAL_HEAD", "ADMIN"),
  updateSessionStatus
);
router.patch(
  "/:id/meeting-link",
  requireRole("TEACHER", "PROVINCIAL_COORDINATOR", "REGIONAL_HEAD", "ADMIN"),
  scopeToProvince,
  updateMeetingLink
);

router.post("/:id/enroll", requireRole("STUDENT"), enrollInSession);
router.get("/:id/students", requireRole("TEACHER"), listSessionStudents);

export default router;

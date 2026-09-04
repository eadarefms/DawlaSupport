import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  listMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notifications.controller";

const router = Router();

router.use(requireAuth);
router.get("/mine", listMyNotifications);
router.patch("/:id/read", markNotificationRead);
router.patch("/read-all", markAllNotificationsRead);

export default router;

import { Router } from "express";
import authRoutes from "./auth.routes";
import metaRoutes from "./meta.routes";
import sessionRoutes from "./session.routes";
import scheduleRoutes from "./schedule.routes";
import lessonsRoutes from "./lessons.routes";
import beneficiariesRoutes from "./beneficiaries.routes";
import hoursRoutes from "./hours.routes";
import dashboardRoutes from "./dashboard.routes";
import exportRoutes from "./export.routes";
import settingsRoutes from "./settings.routes";
import notificationsRoutes from "./notifications.routes";
import directoryRoutes from "./directory.routes";
import profileRoutes from "./profile.routes";
import usersRoutes from "./users.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/meta", metaRoutes);
router.use("/sessions", sessionRoutes);
router.use("/schedule", scheduleRoutes);
router.use("/lessons", lessonsRoutes);
router.use("/beneficiaries", beneficiariesRoutes);
router.use("/hours", hoursRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/export", exportRoutes);
router.use("/settings", settingsRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/directory", directoryRoutes);
router.use("/profile", profileRoutes);
router.use("/users", usersRoutes);

export default router;

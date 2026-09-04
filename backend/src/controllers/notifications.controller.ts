import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";

export async function listMyNotifications(req: AuthedRequest, res: Response) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.auth!.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return res.json(notifications);
}

export async function markNotificationRead(req: AuthedRequest, res: Response) {
  const notification = await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.auth!.userId },
    data: { isRead: true },
  });
  return res.json({ updated: notification.count });
}

export async function markAllNotificationsRead(req: AuthedRequest, res: Response) {
  const result = await prisma.notification.updateMany({
    where: { userId: req.auth!.userId, isRead: false },
    data: { isRead: true },
  });
  return res.json({ updated: result.count });
}

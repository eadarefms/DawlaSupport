import { prisma } from "../lib/prisma";

/**
 * يطابق enum NotificationType المُعرَّف في schema.prisma. مُعرَّف هنا محليًا
 * (بدل استيراده من @prisma/client) لأن توليد الأنواع الكاملة من Prisma يتطلب
 * تشغيل `npx prisma generate` على جهاز بوصول اعتيادي للإنترنت أولاً.
 */
export type NotificationType =
  | "SESSION_APPROVED"
  | "NEW_ENROLLMENT"
  | "SESSION_REMINDER"
  | "MEETING_LINK_CHANGED"
  | "CERTIFICATE_EARNED"
  | "SESSION_CANCELLED";

export async function createNotification(userId: string, type: NotificationType, message: string) {
  return prisma.notification.create({ data: { userId, type, message } });
}

export async function notifyUserByTeacherId(
  teacherId: string,
  type: NotificationType,
  message: string
) {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) return;
  await createNotification(teacher.userId, type, message);
}

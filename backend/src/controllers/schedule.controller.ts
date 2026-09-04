import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";
import { startOfWeek, endOfWeek } from "../utils/dateRules";
import { ensureMeetingLinks } from "../services/session.service";

const weeklyQuerySchema = z.object({
  levelId: z.string().optional(),
  streamId: z.string().optional(),
  subjectId: z.string().optional(),
  teacherId: z.string().optional(),
  weekStart: z.string().optional(), // ISO date؛ إن لم يُحدَّد، يُستعمل الأسبوع الحالي
});

/**
 * استعمال الزمن الأسبوعي: يُرجع جميع الحصص (غير الملغاة) ضمن أسبوع مُحدَّد،
 * مع إمكانية الفلترة حسب المستوى/الشعبة/المادة/الأستاذ.
 * يُستعمل من طرف الأستاذ لمعاينة الجدول قبل اقتراح حصة جديدة، ومن طرف
 * التلميذ/المنسق/رئيس المصلحة للاطلاع العام.
 */
export async function getWeeklySchedule(req: AuthedRequest, res: Response) {
  const q = weeklyQuerySchema.parse(req.query);

  const reference = q.weekStart ? new Date(q.weekStart) : new Date();
  const weekStart = startOfWeek(reference);
  const weekEnd = endOfWeek(weekStart);

  const where: any = {
    date: { gte: weekStart, lte: weekEnd },
    status: { not: "CANCELLED" },
  };

  // التلميذ لا يستطيع تغيير المستوى/الشعبة عبر معاملات الطلب؛
  // استعمال الزمن يُحصر دائمًا في بياناته المسجلة في الحساب.
  if (req.auth?.role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId: req.auth.userId },
      select: { levelId: true, streamId: true },
    });

    if (!student?.levelId) {
      return res.json({
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        sessions: [],
      });
    }

    where.levelId = student.levelId;
    where.streamId = student.streamId ?? null;
  }
  if (req.auth?.role !== "STUDENT") {
    if (q.levelId) where.levelId = q.levelId;
    if (q.streamId) where.streamId = q.streamId;
  }
  if (q.subjectId) where.subjectId = q.subjectId;
  if (q.teacherId) where.teacherId = q.teacherId;

  const scopedProvinceId = (req as any).scopedProvinceId as string | null | undefined;
  if (scopedProvinceId) {
    where.teacher = { provinceId: scopedProvinceId };
  }

  const sessions = await prisma.session.findMany({
    where,
    include: { teacher: true, level: true, stream: true, subject: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const sessionsWithLinks = await ensureMeetingLinks(sessions);

  return res.json({
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    sessions: sessionsWithLinks,
  });
}

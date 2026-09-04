import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/error.middleware";
import { AuthedRequest } from "../middleware/auth.middleware";
import { createSession, findSchedulingConflict, ensureMeetingLinks } from "../services/session.service";
import { recalculateTeacherHours } from "../services/hours.service";
import { getActiveSchoolYearId } from "../services/schoolYear.service";
import { createNotification, notifyUserByTeacherId } from "../services/notification.service";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const proposeSessionSchema = z.object({
  levelId: z.string().min(1, "المستوى مطلوب"),
  streamId: z.string().optional().nullable(),
  subjectId: z.string().min(1, "المادة مطلوبة"),
  title: z.string().min(3, "عنوان الدرس مطلوب"),
  date: z.string().min(1, "التاريخ مطلوب"),
  startTime: z.string().regex(timeRegex, "صيغة وقت البداية غير صالحة"),
  endTime: z.string().regex(timeRegex, "صيغة وقت النهاية غير صالحة"),
});

async function getTeacherIdForUser(userId: string): Promise<string> {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) throw new AppError(403, "هذا الحساب ليس حساب أستاذ");
  return teacher.id;
}

export async function proposeSession(req: AuthedRequest, res: Response) {
  const data = proposeSessionSchema.parse(req.body);
  const teacher = await prisma.teacher.findUnique({
    where: { userId: req.auth!.userId },
    include: { level: true, stream: true, school: true },
  });
  if (!teacher) throw new AppError(403, "هذا الحساب ليس حساب أستاذ");

  if (!teacher.provinceId || !teacher.schoolId || !teacher.school?.name?.trim()) {
    throw new AppError(400, "بيانات المديرية الإقليمية والمؤسسة التعليمية غير مكتملة.");
  }

  const level = await prisma.level.findUnique({ where: { id: data.levelId } });
  if (!level) throw new AppError(400, "المستوى غير صالح");
  if (level.hasStreams && !data.streamId) {
    throw new AppError(400, "يجب اختيار الشعبة لهذا المستوى");
  }

  const levelId = data.levelId;
  const streamId = data.streamId ?? null;

  const schoolYearId = await getActiveSchoolYearId();

  const session = await createSession({
    teacherId: teacher.id,
    levelId,
    streamId,
    subjectId: data.subjectId,
    title: data.title,
    date: new Date(data.date),
    startTime: data.startTime,
    endTime: data.endTime,
    schoolYearId,
  });

  return res.status(201).json(session);
}

/** يتحقق من التعارض دون إنشاء الحصة — يُستعمل من الواجهة قبل الضغط على "تأكيد" */
export async function checkConflict(req: AuthedRequest, res: Response) {
  const data = proposeSessionSchema.parse(req.body);
  const teacher = await prisma.teacher.findUnique({
    where: { userId: req.auth!.userId },
    include: { level: true, stream: true, school: true },
  });
  if (!teacher) throw new AppError(403, "هذا الحساب ليس حساب أستاذ");

  if (!teacher.provinceId || !teacher.schoolId || !teacher.school?.name?.trim()) {
    throw new AppError(400, "بيانات المديرية الإقليمية والمؤسسة التعليمية غير مكتملة.");
  }

  const level = await prisma.level.findUnique({ where: { id: data.levelId } });
  if (!level) throw new AppError(400, "المستوى غير صالح");
  if (level.hasStreams && !data.streamId) {
    throw new AppError(400, "يجب اختيار الشعبة لهذا المستوى");
  }

  const schoolYearId = await getActiveSchoolYearId();

  const conflictMessage = await findSchedulingConflict({
    teacherId: teacher.id,
    levelId: data.levelId,
    streamId: data.streamId ?? null,
    subjectId: data.subjectId,
    title: data.title,
    date: new Date(data.date),
    startTime: data.startTime,
    endTime: data.endTime,
    schoolYearId,
  });

  return res.json({ hasConflict: Boolean(conflictMessage), message: conflictMessage });
}

const listQuerySchema = z.object({
  levelId: z.string().optional(),
  streamId: z.string().optional(),
  subjectId: z.string().optional(),
  teacherId: z.string().optional(),
  status: z.string().optional(),
  date: z.string().optional(),
  weekStart: z.string().optional(),
  weekEnd: z.string().optional(),
});

export async function listSessions(req: AuthedRequest, res: Response) {
  const q = listQuerySchema.parse(req.query);

  const where: any = {};
  if (q.levelId) where.levelId = q.levelId;
  if (q.streamId) where.streamId = q.streamId;
  if (q.subjectId) where.subjectId = q.subjectId;
  if (q.teacherId) where.teacherId = q.teacherId;
  if (q.status) where.status = q.status;
  if (q.date) where.date = new Date(q.date);
  if (q.weekStart && q.weekEnd) {
    where.date = { gte: new Date(q.weekStart), lte: new Date(q.weekEnd) };
  }

  // عزل حسب المديرية للمنسق الإقليمي
  const scopedProvinceId = (req as any).scopedProvinceId as string | null | undefined;
  if (scopedProvinceId) {
    where.teacher = { provinceId: scopedProvinceId };
  }

  const sessions = await prisma.session.findMany({
    where,
    include: { teacher: true, level: true, stream: true, subject: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return res.json(await ensureMeetingLinks(sessions));
}

export async function getMySchedule(req: AuthedRequest, res: Response) {
  const auth = req.auth!;

  if (auth.role === "TEACHER") {
    const teacherId = await getTeacherIdForUser(auth.userId);
    const sessions = await prisma.session.findMany({
      where: { teacherId },
      include: { level: true, stream: true, subject: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
    return res.json(await ensureMeetingLinks(sessions));
  }

  if (auth.role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: auth.userId } });
    if (!student) throw new AppError(403, "هذا الحساب ليس حساب تلميذ");
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id },
      include: {
        session: { include: { teacher: true, level: true, stream: true, subject: true } },
      },
      orderBy: { session: { date: "asc" } },
    });
    const sessions = enrollments.map((e: (typeof enrollments)[number]) => e.session);
    return res.json(await ensureMeetingLinks(sessions));
  }

  throw new AppError(400, "غير مدعوم لهذا النوع من الحسابات");
}

const statusSchema = z.object({
  status: z.enum(["PROPOSED", "UNDER_REVIEW", "APPROVED", "SCHEDULED", "COMPLETED", "CANCELLED"]),
});

export async function updateSessionStatus(req: AuthedRequest, res: Response) {
  const { status } = statusSchema.parse(req.body);
  const session = await prisma.session.update({
    where: { id: req.params.id },
    data: { status },
  });

  if (status === "APPROVED") {
    await notifyUserByTeacherId(session.teacherId, "SESSION_APPROVED", `تم قبول حصتك "${session.title}".`);
  }

  if (status === "CANCELLED") {
    await notifyUserByTeacherId(session.teacherId, "SESSION_CANCELLED", `تم إلغاء حصتك "${session.title}".`);
    const enrollments = await prisma.enrollment.findMany({
      where: { sessionId: session.id },
      include: { student: true },
    });
    for (const e of enrollments) {
      await createNotification(
        e.student.userId,
        "SESSION_CANCELLED",
        `تم إلغاء الحصة "${session.title}" التي سجّلت فيها.`
      );
    }
  }

  // عند اكتمال الحصة، يُعاد احتساب ساعات الأستاذ تلقائيًا وتُصدر أي شهادة مستحقة
  if (status === "COMPLETED") {
    const result = await recalculateTeacherHours(session.teacherId, session.schoolYearId);
    for (const cert of result.newlyIssued) {
      await notifyUserByTeacherId(
        session.teacherId,
        "CERTIFICATE_EARNED",
        `مبروك! أصبحت مستحقًا للشهادة التقديرية رقم ${cert.certificateNumber}.`
      );
    }
  }

  return res.json(session);
}

const meetingLinkSchema = z.object({
  meetingLink: z.string().url("الرابط غير صالح"),
});

export async function updateMeetingLink(req: AuthedRequest, res: Response) {
  const { meetingLink } = meetingLinkSchema.parse(req.body);
  const auth = req.auth!;

  const session = await prisma.session.findUnique({
    where: { id: req.params.id },
    include: { teacher: true },
  });
  if (!session) throw new AppError(404, "الحصة غير موجودة");

  if (auth.role === "TEACHER") {
    const teacherId = await getTeacherIdForUser(auth.userId);
    if (session.teacherId !== teacherId) {
      throw new AppError(403, "لا يمكنك تعديل رابط حصة لا تعود لك");
    }
  } else if (auth.role === "PROVINCIAL_COORDINATOR") {
    // المنسق الإقليمي يستطيع تعديل روابط حصص مديريته فقط.
    const scopedProvinceId = (req as any).scopedProvinceId as string | null | undefined;
    if (!scopedProvinceId || session.teacher.provinceId !== scopedProvinceId) {
      throw new AppError(403, "لا يمكنك تعديل رابط حصة تابعة لمديرية أخرى");
    }
  } else if (auth.role !== "REGIONAL_HEAD" && auth.role !== "ADMIN") {
    throw new AppError(403, "ليست لديك الصلاحية لتعديل رابط هذه الحصة");
  }

  const updated = await prisma.session.update({
    where: { id: req.params.id },
    data: { meetingLink, meetingProvider: "MANUAL" },
    include: { teacher: true, level: true, stream: true, subject: true },
  });
  return res.json(updated);
}

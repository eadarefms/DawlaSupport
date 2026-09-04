import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/error.middleware";
import { AuthedRequest } from "../middleware/auth.middleware";
import { notifyUserByTeacherId } from "../services/notification.service";
import { ensureMeetingLinks } from "../services/session.service";

async function getStudentForUser(userId: string) {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) throw new AppError(403, "هذا الحساب ليس حساب تلميذ");
  return student;
}

async function getTeacherIdForUser(userId: string): Promise<string> {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) throw new AppError(403, "هذا الحساب ليس حساب أستاذ");
  return teacher.id;
}

const enrollSchema = z.object({
  fullName: z.string().min(3, "الاسم الكامل مطلوب"),
  code: z.string().min(1, "رمز مسار مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  province: z.string().optional(),
  school: z.string().optional(),
});

export async function enrollInSession(req: AuthedRequest, res: Response) {
  const data = enrollSchema.parse(req.body);
  const student = await getStudentForUser(req.auth!.userId);
  const session = await prisma.session.findUnique({ where: { id: req.params.id } });
  if (!session) throw new AppError(404, "الحصة غير موجودة");
  if (session.status === "CANCELLED") throw new AppError(400, "لا يمكن التسجيل في حصة ملغاة");
  if (session.status === "COMPLETED") throw new AppError(400, "لا يمكن التسجيل في حصة مكتملة");

  try {
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: student.id,
        sessionId: session.id,
        fullName: data.fullName,
        code: data.code,
        email: data.email,
        province: data.province,
        school: data.school,
      },
    });
    await notifyUserByTeacherId(
      session.teacherId,
      "NEW_ENROLLMENT",
      `تم تسجيل تلميذ جديد (${data.fullName}) في حصة "${session.title}".`
    );
    return res.status(201).json(enrollment);
  } catch (err: any) {
    if (err?.code === "P2002") throw new AppError(409, "لقد قمت بالتسجيل مسبقًا في هذه الحصة.");
    throw err;
  }
}

export async function listSessionStudents(req: AuthedRequest, res: Response) {
  const teacherId = await getTeacherIdForUser(req.auth!.userId);
  const session = await prisma.session.findUnique({ where: { id: req.params.id } });
  if (!session) throw new AppError(404, "الحصة غير موجودة");
  if (session.teacherId !== teacherId) throw new AppError(403, "لا يمكنك الاطلاع على لائحة تلاميذ حصة لا تعود لك");
  const enrollments = await prisma.enrollment.findMany({
    where: { sessionId: session.id },
    orderBy: { registeredAt: "asc" },
  });
  return res.json(enrollments);
}

export async function listMyBeneficiaries(req: AuthedRequest, res: Response) {
  const teacherId = await getTeacherIdForUser(req.auth!.userId);
  const enrollments = await prisma.enrollment.findMany({
    where: { session: { teacherId } },
    include: { session: { include: { level: true, stream: true, subject: true } } },
    orderBy: { registeredAt: "desc" },
  });
  return res.json(enrollments);
}

export async function listAvailableLessons(req: AuthedRequest, res: Response) {
  const student = await getStudentForUser(req.auth!.userId);

  // لا نعتمد على إعدادات الحساب ولا نعرض أي رابط لإعدادات الحساب.
  // يجب أن يكون المستوى محفوظًا أثناء تسجيل التلميذ.
  if (!student.levelId) {
    return res.json([]);
  }

  const sessions = await prisma.session.findMany({
    where: {
      levelId: student.levelId,
      streamId: student.streamId ?? undefined,
      status: { in: ["PROPOSED", "UNDER_REVIEW", "APPROVED", "SCHEDULED"] },
      date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
    include: { teacher: true, level: true, stream: true, subject: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const sessionsWithLinks = await ensureMeetingLinks(sessions);
  const myEnrollments = await prisma.enrollment.findMany({
    where: { studentId: student.id },
    select: { sessionId: true },
  });
  const enrolledIds = new Set(myEnrollments.map((e: { sessionId: string }) => e.sessionId));
  const shaped = sessionsWithLinks.map((s: (typeof sessionsWithLinks)[number]) => ({
    ...s,
    isEnrolled: enrolledIds.has(s.id),
  }));

  return res.json(shaped);
}

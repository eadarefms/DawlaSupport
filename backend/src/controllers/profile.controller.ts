import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/error.middleware";
import { AuthedRequest } from "../middleware/auth.middleware";

const baseProfileSchema = z.object({
  levelId: z.string().min(1, "المستوى مطلوب"),
  streamId: z.string().optional().nullable(),
  provinceId: z.string().min(1, "المديرية الإقليمية مطلوبة"),
  schoolName: z.string().trim().min(2, "المؤسسة التعليمية مطلوبة"),
});

async function validateAcademicAndSchool(data: z.infer<typeof baseProfileSchema>) {
  const [level, province] = await Promise.all([
    prisma.level.findUnique({ where: { id: data.levelId }, include: { streams: true } }),
    prisma.province.findUnique({ where: { id: data.provinceId } }),
  ]);
  if (!level) throw new AppError(400, "المستوى غير صالح");
  if (!province) throw new AppError(400, "المديرية الإقليمية غير صالحة");
  if (level.hasStreams && !data.streamId) throw new AppError(400, "يجب اختيار الشعبة لهذا المستوى");
  if (data.streamId && !level.streams.some((item) => item.id === data.streamId)) throw new AppError(400, "الشعبة لا تنتمي إلى المستوى المختار");
  const school = await prisma.school.upsert({
    where: { name_provinceId: { name: data.schoolName, provinceId: data.provinceId } },
    update: {},
    create: { name: data.schoolName, provinceId: data.provinceId },
  });
  return { level, school };
}

export async function updateMyStudentProfile(req: AuthedRequest, res: Response) {
  const data = baseProfileSchema.parse(req.body);
  const { level, school } = await validateAcademicAndSchool(data);
  const student = await prisma.student.findUnique({ where: { userId: req.auth!.userId } });
  if (!student) throw new AppError(403, "هذا الحساب ليس حساب تلميذ");
  const updated = await prisma.student.update({
    where: { id: student.id },
    data: { levelId: level.id, streamId: level.hasStreams ? data.streamId! : null, provinceId: data.provinceId, schoolId: school.id },
    include: { level: true, stream: true, province: true, school: true },
  });
  return res.json(updated);
}

// بالنسبة للأستاذ: المديرية الإقليمية مأخوذة من التسجيل ولا يمكن تعديلها.
const teacherProfileSchema = z.object({
  levelId: z.string().min(1, "المستوى مطلوب"),
  streamId: z.string().optional().nullable(),
  schoolName: z.string().trim().min(2, "المؤسسة التعليمية مطلوبة"),
});

export async function updateMyTeacherProfile(req: AuthedRequest, res: Response) {
  const data = teacherProfileSchema.parse(req.body);
  const teacher = await prisma.teacher.findUnique({ where: { userId: req.auth!.userId } });
  if (!teacher) throw new AppError(403, "هذا الحساب ليس حساب أستاذ");
  if (!teacher.provinceId) throw new AppError(400, "المديرية الإقليمية غير مسجلة لهذا الحساب");

  const [level, province] = await Promise.all([
    prisma.level.findUnique({ where: { id: data.levelId }, include: { streams: true } }),
    prisma.province.findUnique({ where: { id: teacher.provinceId } }),
  ]);
  if (!level) throw new AppError(400, "المستوى غير صالح");
  if (!province) throw new AppError(400, "المديرية الإقليمية غير صالحة");
  if (level.hasStreams && !data.streamId) throw new AppError(400, "يجب اختيار الشعبة لهذا المستوى");
  if (data.streamId && !level.streams.some((item) => item.id === data.streamId)) throw new AppError(400, "الشعبة لا تنتمي إلى المستوى المختار");

  const school = await prisma.school.upsert({
    where: { name_provinceId: { name: data.schoolName, provinceId: teacher.provinceId } },
    update: {},
    create: { name: data.schoolName, provinceId: teacher.provinceId },
  });

  const updated = await prisma.teacher.update({
    where: { id: teacher.id },
    data: { levelId: level.id, streamId: level.hasStreams ? data.streamId! : null, provinceId: teacher.provinceId, schoolId: school.id },
    include: { level: true, stream: true, province: true, school: true },
  });
  return res.json(updated);
}

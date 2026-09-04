import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/error.middleware";
import { AuthedRequest } from "../middleware/auth.middleware";
import { hashPassword } from "../utils/password";

const roles = ["ADMIN", "REGIONAL_HEAD", "PROVINCIAL_COORDINATOR", "TEACHER", "STUDENT"] as const;

function normalizeAndValidateUsername(username: string, role: typeof roles[number]) {
  const value = username.trim();
  if (role === "REGIONAL_HEAD" || role === "PROVINCIAL_COORDINATOR" || role === "TEACHER") {
    if (!/^\d+$/.test(value)) throw new AppError(400, "اسم المستخدم لهذا الحساب يجب أن يكون رقم التأجير ويتكون من أرقام فقط");
    return value;
  }
  if (role === "STUDENT") {
    const normalized = value.toUpperCase();
    if (!/^[A-Z]\d+$/.test(normalized)) throw new AppError(400, "اسم المستخدم للتلميذ يجب أن يكون رمز مسار: حرف واحد متبوع بأرقام");
    return normalized;
  }
  return value;
}

const createUserSchema = z.object({
  username: z.string().trim().min(2, "اسم المستخدم مطلوب"),
  password: z.string().min(6, "كلمة المرور يجب أن تتكون من 6 خانات على الأقل"),
  fullName: z.string().trim().min(3, "الاسم الكامل مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح").optional().or(z.literal("")),
  role: z.enum(roles),
  provinceId: z.string().optional().nullable(),
  schoolName: z.string().trim().optional().nullable(),
  levelId: z.string().optional().nullable(),
  streamId: z.string().optional().nullable(),
});

const updateUserSchema = z.object({
  username: z.string().trim().min(2, "اسم المستخدم مطلوب").optional(),
  fullName: z.string().trim().min(3, "الاسم الكامل مطلوب").optional(),
  email: z.string().email("البريد الإلكتروني غير صالح").optional().or(z.literal("")),
  password: z.string().min(6, "كلمة المرور يجب أن تتكون من 6 خانات على الأقل").optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  provinceId: z.string().optional().nullable(),
  schoolName: z.string().trim().optional().nullable(),
  levelId: z.string().optional().nullable(),
  streamId: z.string().optional().nullable(),
});

async function academicData(provinceId?: string | null, schoolName?: string | null, levelId?: string | null, streamId?: string | null) {
  if (!provinceId || !schoolName || !levelId) {
    throw new AppError(400, "المديرية والمؤسسة والمستوى مطلوبة لهذا الحساب");
  }
  const [province, level] = await Promise.all([
    prisma.province.findUnique({ where: { id: provinceId } }),
    prisma.level.findUnique({ where: { id: levelId }, include: { streams: true } }),
  ]);
  if (!province) throw new AppError(400, "المديرية الإقليمية غير صالحة");
  if (!level) throw new AppError(400, "المستوى غير صالح");
  if (level.hasStreams && !streamId) throw new AppError(400, "يجب اختيار الشعبة لهذا المستوى");
  if (streamId && !level.streams.some((s) => s.id === streamId)) throw new AppError(400, "الشعبة لا تنتمي إلى المستوى المختار");
  const school = await prisma.school.upsert({
    where: { name_provinceId: { name: schoolName.trim(), provinceId } },
    update: {},
    create: { name: schoolName.trim(), provinceId },
  });
  return { province, level, school };
}

function profileOf(user: any) {
  const profile = user.teacher ?? user.student ?? null;
  return {
    province: profile?.province ?? user.province ?? null,
    school: profile?.school ?? null,
    level: profile?.level ?? null,
    stream: profile?.stream ?? null,
    matricule: user.teacher?.matricule ?? null,
    code: user.student?.code ?? null,
  };
}

export async function listUsers(req: AuthedRequest, res: Response) {
  const users = await prisma.user.findMany({
    include: {
      province: true,
      teacher: { include: { province: true, school: true, level: true, stream: true } },
      student: { include: { province: true, school: true, level: true, stream: true } },
    },
    orderBy: [{ role: "asc" }, { username: "asc" }],
  });
  return res.json(users.map((u) => ({ id: u.id, username: u.username, email: u.email, fullName: u.fullName ?? u.teacher?.fullName ?? u.student?.fullName ?? u.username, role: u.role, isActive: u.isActive, createdAt: u.createdAt, ...profileOf(u) })));
}

export async function createUser(req: AuthedRequest, res: Response) {
  const parsed = createUserSchema.parse(req.body);
  const data = { ...parsed, username: normalizeAndValidateUsername(parsed.username, parsed.role) };
  if (data.role === "PROVINCIAL_COORDINATOR" && !data.provinceId) throw new AppError(400, "المديرية مطلوبة للمنسق الإقليمي");
  if ((data.role === "TEACHER" || data.role === "STUDENT")) await academicData(data.provinceId, data.schoolName, data.levelId, data.streamId);
  const existing = await prisma.user.findUnique({ where: { username: data.username } });
  if (existing) throw new AppError(409, "اسم المستخدم مستعمل مسبقًا");
  const passwordHash = await hashPassword(data.password);
  const email = data.email || null;
  const userData: any = { username: data.username, passwordHash, role: data.role, email, provinceId: data.role === "PROVINCIAL_COORDINATOR" ? data.provinceId : null };
  if (data.role === "ADMIN" || data.role === "REGIONAL_HEAD" || data.role === "PROVINCIAL_COORDINATOR") userData.fullName = data.fullName;
  if (data.role === "TEACHER") {
    const { level, school } = await academicData(data.provinceId, data.schoolName, data.levelId, data.streamId);
    userData.teacher = { create: { fullName: data.fullName, matricule: data.username, email: email || "", provinceId: data.provinceId!, schoolId: school.id, levelId: data.levelId!, streamId: level.hasStreams ? data.streamId : null } };
  }
  if (data.role === "STUDENT") {
    const { level, school } = await academicData(data.provinceId, data.schoolName, data.levelId, data.streamId);
    userData.student = { create: { fullName: data.fullName, code: data.username, email: email || "", provinceId: data.provinceId!, schoolId: school.id, levelId: data.levelId!, streamId: level.hasStreams ? data.streamId : null } };
  }
  const user = await prisma.user.create({ data: userData, include: { province: true, teacher: { include: { province: true, school: true, level: true, stream: true } }, student: { include: { province: true, school: true, level: true, stream: true } } } });
  return res.status(201).json({ id: user.id, username: user.username, email: user.email, fullName: user.fullName ?? user.teacher?.fullName ?? user.student?.fullName ?? user.username, role: user.role, isActive: user.isActive, createdAt: user.createdAt, ...profileOf(user) });
}

export async function updateUser(req: AuthedRequest, res: Response) {
  const data = updateUserSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { id: req.params.id }, include: { teacher: { include: { school: true } }, student: { include: { school: true } } } });
  if (!existing) throw new AppError(404, "الحساب غير موجود");
  if (existing.id === req.auth?.userId && data.isActive === false) throw new AppError(400, "لا يمكنك تعطيل حسابك الحالي");

  const normalizedUsername = data.username !== undefined
    ? normalizeAndValidateUsername(data.username, existing.role)
    : undefined;
  if (normalizedUsername && normalizedUsername !== existing.username) {
    const duplicate = await prisma.user.findUnique({ where: { username: normalizedUsername } });
    if (duplicate && duplicate.id !== existing.id) throw new AppError(409, "اسم المستخدم مستعمل مسبقًا");
  }

  let profileData: any = null;
  if (existing.role === "TEACHER" || existing.role === "STUDENT") {
    const current = existing.teacher ?? existing.student;
    const provinceId = data.provinceId ?? current?.provinceId;
    const levelId = data.levelId ?? current?.levelId;
    const schoolName = data.schoolName ?? current?.school?.name ?? null;
    const streamId = data.streamId ?? current?.streamId;
    if (data.provinceId || data.levelId || data.schoolName !== undefined || data.streamId !== undefined) {
      const academic = await academicData(provinceId, schoolName, levelId, streamId);
      profileData = { provinceId, schoolId: academic.school.id, levelId, streamId: academic.level.hasStreams ? streamId : null };
    }
  }

  const userData: any = {};
  if (normalizedUsername !== undefined) userData.username = normalizedUsername;
  if (data.fullName !== undefined && (existing.role === "ADMIN" || existing.role === "REGIONAL_HEAD" || existing.role === "PROVINCIAL_COORDINATOR")) userData.fullName = data.fullName;
  if (data.email !== undefined) userData.email = data.email || null;
  if (data.isActive !== undefined) userData.isActive = data.isActive;
  if (data.password) userData.passwordHash = await hashPassword(data.password);
  if (existing.role === "PROVINCIAL_COORDINATOR" && data.provinceId !== undefined) userData.provinceId = data.provinceId;

  const user = await prisma.user.update({ where: { id: existing.id }, data: userData, include: { province: true, teacher: { include: { province: true, school: true, level: true, stream: true } }, student: { include: { province: true, school: true, level: true, stream: true } } } });
  if ((profileData || data.fullName !== undefined || data.email !== undefined) && user.teacher) await prisma.teacher.update({ where: { id: user.teacher.id }, data: { ...(data.fullName ? { fullName: data.fullName } : {}), ...(data.email !== undefined ? { email: data.email || "" } : {}), ...(normalizedUsername !== undefined ? { matricule: normalizedUsername } : {}), ...profileData } });
  if ((profileData || data.fullName !== undefined || data.email !== undefined) && user.student) await prisma.student.update({ where: { id: user.student.id }, data: { ...(data.fullName ? { fullName: data.fullName } : {}), ...(data.email !== undefined ? { email: data.email || "" } : {}), ...(normalizedUsername !== undefined ? { code: normalizedUsername } : {}), ...profileData } });
  const fresh = await prisma.user.findUnique({ where: { id: existing.id }, include: { province: true, teacher: { include: { province: true, school: true, level: true, stream: true } }, student: { include: { province: true, school: true, level: true, stream: true } } } });
  return res.json({ id: fresh!.id, username: fresh!.username, email: fresh!.email, fullName: fresh!.fullName ?? fresh!.teacher?.fullName ?? fresh!.student?.fullName ?? fresh!.username, role: fresh!.role, isActive: fresh!.isActive, createdAt: fresh!.createdAt, ...profileOf(fresh) });
}


export async function deleteUser(req: AuthedRequest, res: Response) {
  const id = req.params.id;
  if (id === req.auth?.userId) throw new AppError(400, "لا يمكنك حذف حسابك الحالي");

  const existing = await prisma.user.findUnique({
    where: { id },
    include: { teacher: true, student: true },
  });
  if (!existing) throw new AppError(404, "الحساب غير موجود");

  await prisma.$transaction(async (tx) => {
    // حذف البيانات التابعة أولاً لأن بعض العلاقات لا تستخدم onDelete: Cascade.
    if (existing.teacher) {
      const sessions = await tx.session.findMany({ where: { teacherId: existing.teacher.id }, select: { id: true } });
      const sessionIds = sessions.map((s) => s.id);
      if (sessionIds.length) await tx.enrollment.deleteMany({ where: { sessionId: { in: sessionIds } } });
      await tx.session.deleteMany({ where: { teacherId: existing.teacher.id } });
      await tx.certificate.deleteMany({ where: { teacherId: existing.teacher.id } });
      await tx.teacherHourLedger.deleteMany({ where: { teacherId: existing.teacher.id } });
      await tx.teacher.delete({ where: { id: existing.teacher.id } });
    }

    if (existing.student) {
      await tx.enrollment.deleteMany({ where: { studentId: existing.student.id } });
      await tx.student.delete({ where: { id: existing.student.id } });
    }

    await tx.user.delete({ where: { id } });
  });

  return res.json({ message: "تم حذف الحساب بنجاح" });
}

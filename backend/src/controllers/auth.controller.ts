import { Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { AppError } from "../middleware/error.middleware";

// ------------------------------------------------------------
// Validation schemas
// ------------------------------------------------------------

const registerTeacherSchema = z.object({
  fullName: z.string().min(3, "الاسم الكامل مطلوب"),
  matricule: z.string().min(2, "رقم التأجير مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تتكون من 6 خانات على الأقل"),
  provinceId: z.string().min(1, "المديرية الإقليمية مطلوبة"),
  otherProvince: z.string().optional(),
  schoolId: z.string().optional(),
});

const registerStudentSchema = z.object({
  fullName: z.string().min(3, "الاسم الكامل مطلوب"),
  code: z.string().min(2, "رمز مسار مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تتكون من 6 خانات على الأقل"),
  provinceId: z.string().min(1, "المديرية الإقليمية مطلوبة"),
  otherProvince: z.string().optional(),
  schoolName: z.string().trim().min(2, "المؤسسة التعليمية مطلوبة"),
  levelId: z.string().min(1, "المستوى مطلوب"),
  streamId: z.string().optional().nullable(),
});

const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(20, "رمز الاسترجاع غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تتكون من 6 خانات على الأقل"),
});

// ------------------------------------------------------------
// Email configuration
// Uses EMAIL_* variables from .env
// ------------------------------------------------------------

function getMailTransporter() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

// ------------------------------------------------------------
// Handlers
// ------------------------------------------------------------

export async function registerTeacher(req: Request, res: Response) {
  const data = registerTeacherSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({ where: { username: data.matricule } });
  if (existingUser) {
    throw new AppError(409, "يوجد حساب مسجل مسبقًا بنفس رقم التأجير");
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      username: data.matricule,
      passwordHash,
      role: "TEACHER",
      email: data.email,
      provinceId: null,
      teacher: {
        create: {
          fullName: data.fullName,
          matricule: data.matricule,
          email: data.email,
          provinceId: data.provinceId,
          otherProvince: data.otherProvince,
          schoolId: data.schoolId || null,
        },
      },
    },
    include: { teacher: true },
  });

  const token = signToken({ userId: user.id, role: user.role });
  return res.status(201).json({
    token,
    user: { id: user.id, role: user.role, fullName: user.fullName ?? user.teacher?.fullName ?? user.username },
  });
}

export async function registerStudent(req: Request, res: Response) {
  const data = registerStudentSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({ where: { username: data.code } });
  if (existingUser) {
    throw new AppError(409, "يوجد حساب مسجل مسبقًا بنفس رمز مسار");
  }

  const [province, level] = await Promise.all([
    prisma.province.findUnique({ where: { id: data.provinceId } }),
    prisma.level.findUnique({ where: { id: data.levelId }, include: { streams: true } }),
  ]);

  if (!province) throw new AppError(400, "المديرية الإقليمية المحددة غير موجودة");
  if (!level) throw new AppError(400, "المستوى المحدد غير موجود");
  if (level.hasStreams && !data.streamId) {
    throw new AppError(400, "يجب اختيار الشعبة لهذا المستوى");
  }
  if (data.streamId && !level.streams.some((stream) => stream.id === data.streamId)) {
    throw new AppError(400, "الشعبة لا تنتمي إلى المستوى المختار");
  }

  const schoolName = data.schoolName.trim();
  let school = await prisma.school.findFirst({
    where: { name: schoolName, provinceId: data.provinceId },
  });

  if (!school) {
    try {
      school = await prisma.school.create({
        data: { name: schoolName, provinceId: data.provinceId },
      });
    } catch (err: any) {
      school = await prisma.school.findFirst({
        where: { name: schoolName, provinceId: data.provinceId },
      });
      if (!school) throw err;
    }
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      username: data.code,
      passwordHash,
      role: "STUDENT",
      email: data.email,
      student: {
        create: {
          fullName: data.fullName,
          code: data.code,
          email: data.email,
          provinceId: data.provinceId,
          otherProvince: data.otherProvince,
          schoolId: school.id,
          levelId: data.levelId,
          streamId: level.hasStreams ? data.streamId! : null,
        },
      },
    },
    include: {
      student: {
        include: {
          level: true,
          stream: true,
          province: true,
          school: true,
        },
      },
    },
  });

  const token = signToken({ userId: user.id, role: user.role });
  return res.status(201).json({
    token,
    user: { id: user.id, role: user.role, fullName: user.student?.fullName },
  });
}

export async function login(req: Request, res: Response) {
  const { username, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { username },
    include: { teacher: true, student: true },
  });

  if (!user || !user.isActive) {
    throw new AppError(401, "بيانات الدخول غير صحيحة");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "بيانات الدخول غير صحيحة");
  }

  const token = signToken({
    userId: user.id,
    role: user.role,
    provinceId: user.provinceId,
  });

  return res.json({
    token,
    user: {
      id: user.id,
      role: user.role,
      fullName: user.fullName ?? user.teacher?.fullName ?? user.username,
    },
  });
}

export async function me(req: Request, res: Response) {
  const auth = (req as any).auth;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: {
      teacher: {
        include: {
          province: true,
          level: true,
          stream: true,
          school: true,
        },
      },
      student: {
        include: {
          province: true,
          level: true,
          stream: true,
          school: true,
        },
      },
      province: true,
    },
  });

  if (!user) throw new AppError(404, "المستخدم غير موجود");

  return res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName ?? user.teacher?.fullName ?? user.student?.fullName ?? user.username,
    email: user.email,
    teacher: user.teacher,
    student: user.student,
    province: user.province,
  });
}

// ------------------------------------------------------------
// Password recovery
// ------------------------------------------------------------

export async function forgotPassword(req: Request, res: Response) {
  const { email } = forgotPasswordSchema.parse(req.body);
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail },
  });

  // Do not reveal whether the email exists.
  const genericMessage =
    "إذا كان البريد الإلكتروني مسجلاً، فسيتم إرسال رابط استرجاع كلمة المرور إليه.";

  if (!user || !user.isActive) {
    return res.json({ message: genericMessage });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetTokenExpiresAt: expiresAt,
    },
  });

  const frontendUrl = (
    process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:5173"
  ).replace(/\/$/, "");

  const resetUrl =
    `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

  const transporter = getMailTransporter();

  // Local development: if SMTP is not configured, print the link in the backend terminal.
  if (!transporter) {
    console.log(`🔐 رابط استرجاع كلمة المرور لـ ${user.username}: ${resetUrl}`);
    return res.json({ message: genericMessage });
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: user.email!,
    subject: "استرجاع كلمة المرور - منصة الدعم التربوي عن بعد",
    text:
      `لاسترجاع كلمة المرور، افتح الرابط التالي خلال 30 دقيقة:\n${resetUrl}\n\n` +
      "إذا لم تطلب استرجاع كلمة المرور، يمكنك تجاهل هذه الرسالة.",
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8">
        <p>السلام عليكم،</p>
        <p>لاسترجاع كلمة المرور، اضغط على الزر التالي:</p>
        <p>
          <a href="${resetUrl}"
             style="display:inline-block;padding:10px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">
            إعادة تعيين كلمة المرور
          </a>
        </p>
        <p>الرابط صالح لمدة 30 دقيقة ويُستخدم مرة واحدة فقط.</p>
        <p>إذا لم تطلب استرجاع كلمة المرور، يمكنك تجاهل هذه الرسالة.</p>
      </div>
    `,
  });

  return res.json({ message: genericMessage });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = resetPasswordSchema.parse(req.body);

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiresAt: { gt: new Date() },
      isActive: true,
    },
  });

  if (!user) {
    throw new AppError(
      400,
      "رابط استرجاع كلمة المرور غير صالح أو انتهت صلاحيته"
    );
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiresAt: null,
    },
  });

  return res.json({
    message: "تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.",
  });
}

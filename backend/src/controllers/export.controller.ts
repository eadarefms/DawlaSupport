import { Response } from "express";
import ExcelJS from "exceljs";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/error.middleware";
import { AuthedRequest } from "../middleware/auth.middleware";

async function sendWorkbook(res: Response, workbook: ExcelJS.Workbook, filename: string) {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  const encodedFilename = encodeURIComponent(filename);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="export.xlsx"; filename*=UTF-8''${encodedFilename}`
  );
  await workbook.xlsx.write(res);
  res.end();
}

/** تصدير التلاميذ المستفيدين من حصص الأستاذ الحالي */
export async function exportMyBeneficiaries(req: AuthedRequest, res: Response) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: req.auth!.userId } });
  if (!teacher) throw new AppError(403, "هذا الحساب ليس حساب أستاذ");

  const enrollments = await prisma.enrollment.findMany({
    where: { session: { teacherId: teacher.id } },
    include: { session: { include: { subject: true, level: true, stream: true } } },
    orderBy: { registeredAt: "desc" },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("التلاميذ المستفيدون");
  sheet.views = [{ rightToLeft: true }];
  sheet.columns = [
    { header: "الاسم الكامل", key: "fullName", width: 28 },
    { header: "رمز مسار", key: "code", width: 16 },
    { header: "البريد الإلكتروني", key: "email", width: 28 },
    { header: "المديرية", key: "province", width: 16 },
    { header: "المؤسسة", key: "school", width: 22 },
    { header: "الدرس", key: "lesson", width: 26 },
    { header: "المادة", key: "subject", width: 20 },
    { header: "المستوى", key: "level", width: 18 },
    { header: "الشعبة", key: "stream", width: 20 },
    { header: "تاريخ الحصة", key: "date", width: 14 },
    { header: "تاريخ التسجيل", key: "registeredAt", width: 16 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const e of enrollments) {
    sheet.addRow({
      fullName: e.fullName,
      code: e.code,
      email: e.email,
      province: e.province ?? "",
      school: e.school ?? "",
      lesson: e.session.title,
      subject: e.session.subject.name,
      level: e.session.level.name,
      stream: e.session.stream?.name ?? "",
      date: e.session.date.toISOString().slice(0, 10),
      registeredAt: e.registeredAt.toISOString().slice(0, 10),
    });
  }

  await sendWorkbook(res, workbook, "التلاميذ_المستفيدون.xlsx");
}

/** تصدير لائحة الأساتذة (معزولة حسب المديرية للمنسق الإقليمي) */
export async function exportTeachers(req: AuthedRequest, res: Response) {
  const scopedProvinceId = (req as any).scopedProvinceId as string | null | undefined;

  const teachers = await prisma.teacher.findMany({
    where: scopedProvinceId ? { provinceId: scopedProvinceId } : {},
    include: { province: true, school: true },
    orderBy: { fullName: "asc" },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("الأساتذة");
  sheet.views = [{ rightToLeft: true }];
  sheet.columns = [
    { header: "الاسم الكامل", key: "fullName", width: 28 },
    { header: "رقم التأجير", key: "matricule", width: 16 },
    { header: "البريد الإلكتروني", key: "email", width: 28 },
    { header: "المديرية", key: "province", width: 18 },
    { header: "المؤسسة", key: "school", width: 22 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const t of teachers) {
    sheet.addRow({
      fullName: t.fullName,
      matricule: t.matricule,
      email: t.email,
      province: t.province?.name ?? t.otherProvince ?? "",
      school: t.school?.name ?? "",
    });
  }

  await sendWorkbook(res, workbook, "الأساتذة.xlsx");
}


/** تصدير لائحة التلاميذ (معزولة حسب المديرية للمنسق الإقليمي) */
export async function exportStudents(req: AuthedRequest, res: Response) {
  const scopedProvinceId = (req as any).scopedProvinceId as string | null | undefined;

  const students = await prisma.student.findMany({
    where: scopedProvinceId ? { provinceId: scopedProvinceId } : {},
    include: { province: true, school: true, level: true, stream: true },
    orderBy: { fullName: "asc" },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("التلاميذ");
  sheet.views = [{ rightToLeft: true }];
  sheet.columns = [
    { header: "الاسم الكامل", key: "fullName", width: 28 },
    { header: "رمز مسار", key: "code", width: 18 },
    { header: "البريد الإلكتروني", key: "email", width: 28 },
    { header: "المديرية", key: "province", width: 22 },
    { header: "المؤسسة", key: "school", width: 28 },
    { header: "المستوى", key: "level", width: 22 },
    { header: "الشعبة", key: "stream", width: 24 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const s of students) {
    sheet.addRow({
      fullName: s.fullName,
      code: s.code,
      email: s.email,
      province: s.province?.name ?? s.otherProvince ?? "",
      school: s.school?.name ?? "",
      level: s.level?.name ?? "",
      stream: s.stream?.name ?? "",
    });
  }

  await sendWorkbook(res, workbook, "التلاميذ.xlsx");
}

/** تصدير الحصص (معزولة حسب المديرية للمنسق الإقليمي)، بنفس فلاتر لائحة الحصص */
export async function exportSessions(req: AuthedRequest, res: Response) {
  const scopedProvinceId = (req as any).scopedProvinceId as string | null | undefined;

  const sessions = await prisma.session.findMany({
    where: scopedProvinceId ? { teacher: { provinceId: scopedProvinceId } } : {},
    include: { teacher: true, level: true, stream: true, subject: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("الحصص");
  sheet.views = [{ rightToLeft: true }];
  sheet.columns = [
    { header: "التاريخ", key: "date", width: 14 },
    { header: "التوقيت", key: "time", width: 16 },
    { header: "الدرس", key: "title", width: 26 },
    { header: "المستوى", key: "level", width: 18 },
    { header: "الشعبة", key: "stream", width: 20 },
    { header: "المادة", key: "subject", width: 18 },
    { header: "الأستاذ", key: "teacher", width: 24 },
    { header: "الحالة", key: "status", width: 14 },
  ];
  sheet.getRow(1).font = { bold: true };

  const statusLabels: Record<string, string> = {
    PROPOSED: "مقترحة",
    UNDER_REVIEW: "قيد المراجعة",
    APPROVED: "مقبولة",
    SCHEDULED: "مبرمجة",
    COMPLETED: "مكتملة",
    CANCELLED: "ملغاة",
  };

  for (const s of sessions) {
    sheet.addRow({
      date: s.date.toISOString().slice(0, 10),
      time: `${s.startTime}–${s.endTime}`,
      title: s.title,
      level: s.level.name,
      stream: s.stream?.name ?? "",
      subject: s.subject.name,
      teacher: s.teacher.fullName,
      status: statusLabels[s.status] ?? s.status,
    });
  }

  await sendWorkbook(res, workbook, "الحصص.xlsx");
}

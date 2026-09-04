import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/error.middleware";
import { AuthedRequest } from "../middleware/auth.middleware";
import { getActiveSchoolYearId } from "../services/schoolYear.service";
import { getTeacherHoursSummary } from "../services/hours.service";

async function getTeacherIdForUser(userId: string): Promise<string> {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) throw new AppError(403, "هذا الحساب ليس حساب أستاذ");
  return teacher.id;
}

export async function getTeacherDashboard(req: AuthedRequest, res: Response) {
  const teacherId = await getTeacherIdForUser(req.auth!.userId);
  const schoolYearId = await getActiveSchoolYearId();

  const [sessionsCount, distinctStudents, hours, nextSession] = await Promise.all([
    prisma.session.count({ where: { teacherId, schoolYearId, status: { not: "CANCELLED" } } }),
    prisma.enrollment.findMany({ where: { session: { teacherId, schoolYearId } }, select: { studentId: true } }),
    getTeacherHoursSummary(teacherId, schoolYearId),
    prisma.session.findFirst({
      where: { teacherId, schoolYearId, date: { gte: new Date() }, status: { not: "CANCELLED" } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: { level: true, stream: true, subject: true },
    }),
  ]);

  const uniqueStudents = new Set(distinctStudents.map((e: { studentId: string }) => e.studentId));

  return res.json({
    sessionsCount,
    studentsCount: uniqueStudents.size,
    totalHours: Math.round((hours.totalMinutes / 60) * 10) / 10,
    certificatesEarned: hours.certificatesEarned,
    nextSession,
  });
}

/**
 * لوحة قيادة إقليمية: للمنسق تُعزل تلقائيًا على مديريته (عبر scopeToProvince)،
 * ولرئيس المصلحة/المسؤول يمكن تمرير provinceId اختياريًا لعرض مديرية بعينها.
 */
export async function getProvinceDashboard(req: AuthedRequest, res: Response) {
  const schoolYearId = await getActiveSchoolYearId();
  const scopedProvinceId = (req as any).scopedProvinceId as string | null | undefined;
  const provinceId = scopedProvinceId ?? (req.query.provinceId as string | undefined);

  if (!provinceId) {
    throw new AppError(400, "يرجى تحديد المديرية");
  }

  const teacherWhere = { provinceId };
  const [teachersCount, studentsCount, sessionsCount, hoursAgg] = await Promise.all([
    prisma.teacher.count({ where: teacherWhere }),
    prisma.student.count({ where: { provinceId } }),
    prisma.session.count({ where: { schoolYearId, teacher: teacherWhere, status: { not: "CANCELLED" } } }),
    prisma.teacherHourLedger.aggregate({
      where: { schoolYearId, teacher: teacherWhere },
      _sum: { totalMinutes: true },
    }),
  ]);

  const byLevel = await prisma.session.groupBy({
    by: ["levelId"],
    where: { schoolYearId, teacher: teacherWhere, status: { not: "CANCELLED" } },
    _count: { _all: true },
  });
  const levels = await prisma.level.findMany({ where: { id: { in: byLevel.map((b: { levelId: string }) => b.levelId) } } });
  const levelNameById = new Map(levels.map((l: { id: string; name: string }) => [l.id, l.name]));

  return res.json({
    teachersCount,
    studentsCount,
    sessionsCount,
    totalHours: Math.round(((hoursAgg._sum.totalMinutes ?? 0) / 60) * 10) / 10,
    distributionByLevel: byLevel.map((b: { levelId: string; _count: { _all: number } }) => ({
      levelId: b.levelId,
      levelName: levelNameById.get(b.levelId) ?? "—",
      count: b._count._all,
    })),
  });
}

/** لوحة القيادة الجهوية: مقارنة المديريات الثمانية لرئيس المصلحة/المسؤول */
export async function getRegionalDashboard(_req: AuthedRequest, res: Response) {
  const schoolYearId = await getActiveSchoolYearId();

  const provinces = await prisma.province.findMany({ where: { isOther: false }, orderBy: { name: "asc" } });

  const perProvince = await Promise.all(
    provinces.map(async (province: { id: string; name: string }) => {
      const [teachersCount, studentsCount, sessionsCount, hoursAgg] = await Promise.all([
        prisma.teacher.count({ where: { provinceId: province.id } }),
        prisma.student.count({ where: { provinceId: province.id } }),
        prisma.session.count({
          where: { schoolYearId, teacher: { provinceId: province.id }, status: { not: "CANCELLED" } },
        }),
        prisma.teacherHourLedger.aggregate({
          where: { schoolYearId, teacher: { provinceId: province.id } },
          _sum: { totalMinutes: true },
        }),
      ]);
      return {
        provinceId: province.id,
        provinceName: province.name,
        teachersCount,
        studentsCount,
        sessionsCount,
        totalHours: Math.round(((hoursAgg._sum.totalMinutes ?? 0) / 60) * 10) / 10,
      };
    })
  );

  const totals = perProvince.reduce(
    (acc: any, p: any) => ({
      teachersCount: acc.teachersCount + p.teachersCount,
      studentsCount: acc.studentsCount + p.studentsCount,
      sessionsCount: acc.sessionsCount + p.sessionsCount,
      totalHours: acc.totalHours + p.totalHours,
    }),
    { teachersCount: 0, studentsCount: 0, sessionsCount: 0, totalHours: 0 }
  );

  return res.json({ totals, byProvince: perProvince });
}

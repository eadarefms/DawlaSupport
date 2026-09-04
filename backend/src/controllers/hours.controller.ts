import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/error.middleware";
import { AuthedRequest } from "../middleware/auth.middleware";
import { getTeacherHoursSummary } from "../services/hours.service";
import { getActiveSchoolYearId } from "../services/schoolYear.service";

async function getTeacherIdForUser(userId: string): Promise<string> {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) throw new AppError(403, "هذا الحساب ليس حساب أستاذ");
  return teacher.id;
}

/** ملخص ساعات وشهادات الأستاذ الحالي للسنة الدراسية النشطة */
export async function getMyHoursSummary(req: AuthedRequest, res: Response) {
  const teacherId = await getTeacherIdForUser(req.auth!.userId);
  const schoolYearId = await getActiveSchoolYearId();
  const summary = await getTeacherHoursSummary(teacherId, schoolYearId);
  return res.json(summary);
}

/**
 * لائحة الأساتذة المستحقين للشهادات (كل من له شهادة واحدة على الأقل)، معزولة
 * حسب المديرية للمنسق الإقليمي.
 */
export async function listEligibleTeachers(req: AuthedRequest, res: Response) {
  const schoolYearId = await getActiveSchoolYearId();
  const scopedProvinceId = (req as any).scopedProvinceId as string | null | undefined;

  const ledgers = await prisma.teacherHourLedger.findMany({
    where: {
      schoolYearId,
      totalMinutes: { gte: 600 },
      ...(scopedProvinceId ? { teacher: { provinceId: scopedProvinceId } } : {}),
    },
    include: {
      teacher: { include: { province: true } },
    },
    orderBy: { totalMinutes: "desc" },
  });

  const results = await Promise.all(
    ledgers.map(async (ledger: (typeof ledgers)[number]) => {
      const certificatesCount = await prisma.certificate.count({
        where: { teacherId: ledger.teacherId, schoolYearId },
      });
      return {
        teacherId: ledger.teacherId,
        fullName: ledger.teacher.fullName,
        matricule: ledger.teacher.matricule,
        province: ledger.teacher.province.name,
        totalMinutes: ledger.totalMinutes,
        certificatesEarned: certificatesCount,
        remainingMinutesToNext: (certificatesCount + 1) * 600 - ledger.totalMinutes,
      };
    })
  );

  return res.json(results);
}

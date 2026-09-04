import { prisma } from "../lib/prisma";

const HOURS_THRESHOLD_MINUTES = 10 * 60; // 10 ساعات = عتبة كل شهادة

/**
 * يعيد احتساب مجموع ساعات الأستاذ (من الحصص المكتملة فقط) لسنة دراسية معينة،
 * ثم يُصدر تلقائيًا أي شهادات تقديرية جديدة استحقها عند تجاوز كل عتبة 10 ساعات.
 * يُستدعى عند تغيير حالة أي حصة إلى "مكتملة".
 */
export async function recalculateTeacherHours(teacherId: string, schoolYearId: string) {
  const completedSessions = await prisma.session.findMany({
    where: { teacherId, schoolYearId, status: "COMPLETED" },
    select: { durationMin: true },
  });

  const totalMinutes = completedSessions.reduce(
    (sum: number, s: { durationMin: number }) => sum + s.durationMin,
    0
  );

  await prisma.teacherHourLedger.upsert({
    where: { teacherId_schoolYearId: { teacherId, schoolYearId } },
    update: { totalMinutes },
    create: { teacherId, schoolYearId, totalMinutes },
  });

  const existingCertificates = await prisma.certificate.findMany({
    where: { teacherId, schoolYearId },
    orderBy: { certificateNumber: "asc" },
  });

  const alreadyIssuedCount = existingCertificates.length;
  const eligibleCount = Math.floor(totalMinutes / HOURS_THRESHOLD_MINUTES);

  const newlyIssued = [];
  for (let n = alreadyIssuedCount + 1; n <= eligibleCount; n++) {
    const certificate = await prisma.certificate.create({
      data: {
        teacherId,
        schoolYearId,
        certificateNumber: n,
        hoursThreshold: 10,
      },
    });
    newlyIssued.push(certificate);
  }

  return {
    totalMinutes,
    certificatesEarned: eligibleCount,
    remainingMinutesToNext: (eligibleCount + 1) * HOURS_THRESHOLD_MINUTES - totalMinutes,
    newlyIssued,
  };
}

export async function getTeacherHoursSummary(teacherId: string, schoolYearId: string) {
  const ledger = await prisma.teacherHourLedger.findUnique({
    where: { teacherId_schoolYearId: { teacherId, schoolYearId } },
  });
  const totalMinutes = ledger?.totalMinutes ?? 0;

  const certificates = await prisma.certificate.findMany({
    where: { teacherId, schoolYearId },
    orderBy: { certificateNumber: "asc" },
  });

  const certificatesEarned = certificates.length;
  const minutesTowardNext = totalMinutes - certificatesEarned * HOURS_THRESHOLD_MINUTES;

  return {
    totalMinutes,
    certificatesEarned,
    minutesTowardNext,
    thresholdMinutes: HOURS_THRESHOLD_MINUTES,
    certificates,
  };
}

import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/error.middleware";

export async function getActiveSchoolYearId(): Promise<string> {
  const settings = await prisma.systemSettings.findUnique({ where: { id: "singleton" } });
  if (settings?.activeSchoolYearId) return settings.activeSchoolYearId;
  const active = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  if (!active) throw new AppError(500, "لا توجد سنة دراسية نشطة. يرجى التواصل مع المسؤول.");
  return active.id;
}

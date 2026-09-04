import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";

export async function getSettings(_req: AuthedRequest, res: Response) {
  const settings = await prisma.systemSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  return res.json(settings);
}

const updateSettingsSchema = z.object({
  academyName: z.string().min(1).optional(),
  serviceName: z.string().min(1).optional(),
  logoUrl: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  platformUrl: z.string().optional().nullable(),
  activeSchoolYearId: z.string().optional().nullable(),
  emailProvider: z.string().optional(),
});

export async function updateSettings(req: AuthedRequest, res: Response) {
  const data = updateSettingsSchema.parse(req.body);
  const settings = await prisma.systemSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  // إن تغيّرت السنة الدراسية النشطة، حدّثها أيضًا في جدول SchoolYear نفسه
  if (data.activeSchoolYearId) {
    await prisma.schoolYear.updateMany({ data: { isActive: false }, where: {} });
    await prisma.schoolYear.update({
      where: { id: data.activeSchoolYearId },
      data: { isActive: true },
    });
  }

  return res.json(settings);
}

const createSchoolYearSchema = z.object({
  label: z.string().min(4, "صيغة السنة الدراسية غير صالحة (مثال: 2027/2028)"),
});

/** إنشاء سنة دراسية جديدة دون حذف بيانات السنوات السابقة */
export async function createSchoolYear(req: AuthedRequest, res: Response) {
  const { label } = createSchoolYearSchema.parse(req.body);
  const year = await prisma.schoolYear.create({ data: { label, isActive: false } });
  return res.status(201).json(year);
}

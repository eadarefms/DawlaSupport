import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";

export async function listTeachersDirectory(req: AuthedRequest, res: Response) {
  const scopedProvinceId = (req as any).scopedProvinceId as string | null | undefined;

  const teachers = await prisma.teacher.findMany({
    where: scopedProvinceId ? { provinceId: scopedProvinceId } : {},
    include: { province: true, school: true, level: true, stream: true },
    orderBy: { fullName: "asc" },
  });

  return res.json(teachers);
}

export async function listStudentsDirectory(req: AuthedRequest, res: Response) {
  const scopedProvinceId = (req as any).scopedProvinceId as string | null | undefined;

  const students = await prisma.student.findMany({
    where: scopedProvinceId ? { provinceId: scopedProvinceId } : {},
    include: { province: true, school: true, level: true, stream: true },
    orderBy: { fullName: "asc" },
  });

  return res.json(students);
}

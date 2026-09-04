import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function listProvinces(_req: Request, res: Response) {
  const provinces = await prisma.province.findMany({ orderBy: { name: "asc" } });
  res.json(provinces);
}

export async function listLevels(_req: Request, res: Response) {
  const levels = await prisma.level.findMany({
    orderBy: { order: "asc" },
    include: {
      streams: true,
      subjects: { include: { subject: true } },
    },
  });

  type LevelWithRelations = (typeof levels)[number];

  const shaped = levels.map((level: LevelWithRelations) => ({
    id: level.id,
    name: level.name,
    hasStreams: level.hasStreams,
    streams: level.streams.map((s: LevelWithRelations["streams"][number]) => ({
      id: s.id,
      name: s.name,
    })),
    subjects: level.subjects.map((ls: LevelWithRelations["subjects"][number]) => ({
      id: ls.subject.id,
      name: ls.subject.name,
    })),
  }));

  res.json(shaped);
}

export async function listSchoolYears(_req: Request, res: Response) {
  const years = await prisma.schoolYear.findMany({ orderBy: { label: "asc" } });
  res.json(years);
}

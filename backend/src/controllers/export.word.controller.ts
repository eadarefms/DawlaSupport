import { Response } from "express";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, VerticalAlign } from "docx";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";
import { startOfWeek, endOfWeek } from "../utils/dateRules";

function formatDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
}

function rtlParagraph(text: string, size = 22, bold = false) {
  return new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text, bold, size, font: "Arial" })],
  });
}

export async function generateWeeklyScheduleWord(req: AuthedRequest, res: Response) {
  const weekStartParam = req.query.weekStart as string | undefined;

  // بالنسبة لمدير النظام، ملف Word الخاص بالنشر يجب أن يكون للأسبوع الموالي
  // حتى يمكن نشر البرمجة مسبقًا قبل بداية أسبوعها. لا نغير سلوك باقي الأدوار.
  const isAdmin = req.auth?.role === "ADMIN";
  const reference = weekStartParam
    ? new Date(weekStartParam)
    : isAdmin
      ? new Date(new Date().setDate(new Date().getDate() + 7))
      : new Date();
  const weekStart = startOfWeek(reference);
  const weekEnd = endOfWeek(weekStart);
  const scopedProvinceId = (req as any).scopedProvinceId as string | null | undefined;

  const sessions = await prisma.session.findMany({
    where: {
      date: { gte: weekStart, lte: weekEnd },
      status: { not: "CANCELLED" },
      ...(scopedProvinceId ? { teacher: { provinceId: scopedProvinceId } } : {}),
    },
    include: { teacher: true, level: true, stream: true, subject: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const settings = await prisma.systemSettings.findUnique({ where: { id: "singleton" } });

  const headerTexts = [
    "الأستاذ/ة",
    "الدرس",
    "المادة",
    "الشعبة",
    "المستوى",
    "التوقيت",
    "التاريخ",
  ];

  const rows = [
    new TableRow({
      tableHeader: true,
      children: headerTexts.map((text) =>
        new TableCell({
          verticalAlign: VerticalAlign.CENTER,
          width: { size: 14, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              bidirectional: true,
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text, bold: true, size: 18, font: "Arial" })],
            }),
          ],
        })
      ),
    }),
    ...sessions.map(
      (s) =>
        new TableRow({
          children: [
            s.teacher.fullName,
            s.title,
            s.subject.name,
            s.stream?.name ?? "-",
            s.level.name,
            `${s.startTime}–${s.endTime}`,
            formatDate(s.date),
          ].map(
            (text) =>
              new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    bidirectional: true,
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text, size: 18, font: "Arial" })],
                  }),
                ],
              })
          ),
        })
    ),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children: [
          rtlParagraph(settings?.academyName ?? "الأكاديمية الجهوية للتربية والتكوين مراكش آسفي", 28, true),
          rtlParagraph(settings?.serviceName ?? "مصلحة التعلم والتكوين عن بعد", 24, true),
          rtlParagraph("البرمجة الأسبوعية للدعم التربوي عن بعد", 26, true),
          rtlParagraph(`من ${formatDate(weekStart)} إلى ${formatDate(weekEnd)}`, 20),
          new Paragraph({ spacing: { after: 180 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows,
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = "البرمجة-الأسبوعية.docx";

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="weekly-schedule.docx"; filename*=UTF-8''${encodeURIComponent(filename)}`
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  res.send(buffer);
}

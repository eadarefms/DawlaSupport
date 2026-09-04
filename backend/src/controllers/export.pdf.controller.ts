import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";
import { startOfWeek, endOfWeek } from "../utils/dateRules";

// خط عربي مضمّن داخل المشروع حتى لا يعتمد التصدير على ملفات الخط في جهاز الخادم.
const ARABIC_FONT_PATH = path.join(__dirname, "..", "..", "assets", "fonts", "arabic.ttf");

function getArabicFontPath(): string {
  if (!fs.existsSync(ARABIC_FONT_PATH)) {
    throw new Error(`Arabic font not found: ${ARABIC_FONT_PATH}`);
  }
  return ARABIC_FONT_PATH;
}

/**
 * PDFKit لا يطبّق خوارزمية BiDi العربية تلقائياً.
 * الخط العربي يقوم بتشكيل الحروف، لكن ترتيب الكلمات يحتاج إلى تجهيز
 * قبل الإرسال إلى PDFKit. نعكس ترتيب الكلمات للنصوص العربية الخالصة
 * حتى تظهر بصرياً بالترتيب العربي الصحيح.
 */
function rtlForPdf(value: string): string {
  if (!value) return value;

  // لا نلمس النصوص اللاتينية/الرقمية مثل التوقيت والتواريخ.
  const hasArabic = /[\u0600-\u06FF]/.test(value);
  const hasLatin = /[A-Za-z]/.test(value);
  if (!hasArabic || hasLatin) return value;

  return value.trim().split(/\s+/).reverse().join(" ");
}

export async function generateWeeklySchedulePdf(req: AuthedRequest, res: Response) {
  const arabicFontPath = getArabicFontPath();

  const weekStartParam = req.query.weekStart as string | undefined;
  const reference = weekStartParam ? new Date(weekStartParam) : new Date();
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

  res.setHeader("Content-Type", "application/pdf");
  const filename = "البرمجة-الأسبوعية.pdf";
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="weekly-schedule.pdf"; filename*=UTF-8''${encodeURIComponent(filename)}`
  );

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  doc.pipe(res);
  doc.font(arabicFontPath);

  if (settings?.logoUrl && fs.existsSync(settings.logoUrl)) {
    doc.image(settings.logoUrl, doc.page.width / 2 - 30, 30, { width: 60 });
    doc.moveDown(3);
  }

  doc.fontSize(14).text(
    rtlForPdf(settings?.academyName ?? "الأكاديمية الجهوية للتربية والتكوين مراكش آسفي"),
    { align: "center" }
  );
  doc.fontSize(12).text(rtlForPdf(settings?.serviceName ?? "مصلحة التعلم والتكوين عن بعد"), {
    align: "center",
  });
  doc.moveDown(0.5);
  doc.fontSize(13).text(rtlForPdf("البرمجة الأسبوعية للدعم التربوي عن بعد"), { align: "center" });
  // نرسم كل جزء من نطاق التاريخ منفصلاً حتى لا يعكس PDFKit
  // ترتيب العبارة المختلطة بين العربية والأرقام.
  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    return `${day}/${month}/${year}`;
  };

  const fromLabel = "من";
  const fromDate = formatDate(weekStart);
  const toLabel = "إلى";
  const toDate = formatDate(weekEnd);
  doc.fontSize(10).font(arabicFontPath);

  const parts = [fromLabel, fromDate, toLabel, toDate];
  const gap = 8;
  const widths = parts.map((part) => doc.widthOfString(part));
  const rangeWidth = widths.reduce((sum, width) => sum + width, 0) + gap * (parts.length - 1);
  let rangeX = (doc.page.width - rangeWidth) / 2;
  const rangeY = doc.y;

  for (let i = 0; i < parts.length; i++) {
    doc.text(parts[i], rangeX, rangeY, { width: widths[i], align: "left" });
    rangeX += widths[i] + gap;
  }
  doc.moveDown(1.5);

  // ترتيب الأعمدة بصرياً من اليسار إلى اليمين.
  // بما أن المستند عربي، يجب أن يكون "التاريخ" في أقصى اليمين
  // و"الأستاذ/ة" في أقصى اليسار.
  const columns = [
    { key: "teacher", label: "الأستاذ/ة", width: 75 },
    { key: "title", label: "الدرس", width: 90 },
    { key: "subject", label: "المادة", width: 65 },
    { key: "stream", label: "الشعبة", width: 75 },
    { key: "level", label: "المستوى", width: 75 },
    { key: "time", label: "التوقيت", width: 70 },
    { key: "date", label: "التاريخ", width: 65 },
  ];

  const tableWidth = columns.reduce((sum, c) => sum + c.width, 0);
  const startX = (doc.page.width - tableWidth) / 2;
  let y = doc.y;

  function drawRow(values: string[], isHeader = false) {
    let x = startX;
    doc.font(arabicFontPath).fontSize(isHeader ? 9.5 : 9);

    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      doc.rect(x, y, column.width, 24).stroke();
      doc.text(rtlForPdf(values[i] ?? "-"), x + 2, y + 6, {
        width: column.width - 4,
        height: 18,
        align: "center",
        ellipsis: true,
      });
      x += column.width;
    }

    y += 24;
  }

  drawRow(columns.map((c) => c.label), true);

  for (const s of sessions) {
    if (y > doc.page.height - 60) {
      doc.addPage();
      doc.font(arabicFontPath);
      y = 40;
      drawRow(columns.map((c) => c.label), true);
    }

    drawRow([
      s.teacher.fullName,
      s.title,
      s.subject.name,
      s.stream?.name ?? "-",
      s.level.name,
      `${s.startTime}–${s.endTime}`,
      s.date.toLocaleDateString("ar-MA"),
    ]);
  }

  doc.end();
}

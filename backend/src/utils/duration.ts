export function computeDurationMinutes(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  if (
    [startH, startM, endH, endM].some((n) => Number.isNaN(n)) ||
    startH < 0 || startH > 23 || endH < 0 || endH > 23 ||
    startM < 0 || startM > 59 || endM < 0 || endM > 59
  ) {
    throw new Error("صيغة الوقت غير صالحة. يجب أن تكون بصيغة HH:mm");
  }

  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  if (endTotal <= startTotal) {
    throw new Error("وقت النهاية يجب أن يكون بعد وقت البداية");
  }

  return endTotal - startTotal;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} دقيقة`;
  if (m === 0) return `${h} ساعة`;
  return `${h} ساعة و${m} دقيقة`;
}

/** يتحقق من تداخل فترتين زمنيتين بصيغة "HH:mm" (بافتراض أنهما في نفس اليوم) */
export function timeRangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** يُرجع "YYYY-MM-DD" لبداية الأسبوع (الاثنين) بالنسبة لتاريخ مُعطى */
export function startOfWeekISO(reference: Date = new Date()): string {
  const d = new Date(reference);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  return toISODate(d);
}

/** أول تاريخ مسموح به لاقتراح حصة جديدة: بداية الأسبوع المقبل */
export function minAllowedDateISO(reference: Date = new Date()): string {
  const d = new Date(startOfWeekISO(reference));
  d.setDate(d.getDate() + 7);
  return toISODate(d);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** يحسب مدة الحصة بالدقائق من "HH:mm" -> "HH:mm"، أو null إذا كانت غير صالحة */
export function computeDurationMinutesClient(start: string, end: string): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return null;
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  if (e <= s) return null;
  return e - s;
}

export function formatDurationClient(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} دقيقة`;
  if (m === 0) return `${h} ساعة`;
  return `${h} ساعة و${m} دقيقة`;
}

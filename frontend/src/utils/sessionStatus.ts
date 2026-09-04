import { SessionStatus } from "../types";

export const STATUS_LABELS: Record<SessionStatus, string> = {
  PROPOSED: "مقترحة",
  UNDER_REVIEW: "قيد المراجعة",
  APPROVED: "مقبولة",
  SCHEDULED: "مبرمجة",
  COMPLETED: "مكتملة",
  CANCELLED: "ملغاة",
};

export const STATUS_CLASSES: Record<SessionStatus, string> = {
  PROPOSED: "bg-slate-100 text-slate-600",
  UNDER_REVIEW: "bg-amber-50 text-amber-700",
  APPROVED: "bg-blue-50 text-blue-700",
  SCHEDULED: "bg-brand-50 text-brand-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-600",
};

export function formatDurationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} د`;
  if (m === 0) return `${h} سا`;
  return `${h} سا ${m} د`;
}

const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function dayNameOf(dateStr: string): string {
  return DAY_NAMES[new Date(dateStr).getDay()];
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ar-MA", { day: "2-digit", month: "2-digit", year: "numeric" });
}

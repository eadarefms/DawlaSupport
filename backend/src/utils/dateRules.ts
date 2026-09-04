/**
 * قواعد التاريخ الخاصة باقتراح الحصص:
 * لا يمكن اختيار تاريخ سابق، ويجب أن تبدأ التواريخ المتاحة من الأسبوع المقبل
 * (بداية الأسبوع = يوم الاثنين).
 */

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** يُرجع تاريخ يوم الاثنين لبداية الأسبوع الحالي بالنسبة للتاريخ المُعطى */
export function startOfWeek(reference: Date = new Date()): Date {
  const d = startOfDay(reference);
  const day = d.getDay(); // 0 = الأحد، 1 = الاثنين ... 6 = السبت
  // نحول الترقيم بحيث يكون الاثنين = 0
  const diffToMonday = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  return d;
}

/** يُرجع تاريخ بداية الأسبوع المقبل (أول تاريخ مسموح به لاقتراح حصة جديدة) */
export function startOfNextWeek(reference: Date = new Date()): Date {
  const thisWeekStart = startOfWeek(reference);
  const nextWeekStart = new Date(thisWeekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  return nextWeekStart;
}

/** يتحقق من أن التاريخ المُعطى يقع ابتداءً من الأسبوع المقبل فما بعد */
export function isDateAllowedForNewSession(date: Date, reference: Date = new Date()): boolean {
  return startOfDay(date).getTime() >= startOfNextWeek(reference).getTime();
}

export function endOfWeek(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

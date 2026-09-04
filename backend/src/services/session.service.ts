import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/error.middleware";
import { computeDurationMinutes } from "../utils/duration";
import { timeRangesOverlap } from "../utils/duration";
import { isDateAllowedForNewSession } from "../utils/dateRules";
import { generateMeeting } from "../lib/meetingProvider";

export interface CreateSessionInput {
  teacherId: string;
  levelId: string;
  streamId?: string | null;
  subjectId: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  schoolYearId: string;
}

/**
 * يفحص التعارضات قبل إنشاء الحصة، وفق القواعد المطلوبة:
 * 1) هل الأستاذ لديه حصة أخرى في نفس التاريخ تتقاطع زمنيًا؟
 * 2) هل توجد حصة أخرى لنفس المستوى والشعبة (نفس مجموعة التلاميذ) تتقاطع زمنيًا؟
 * تُرجع رسالة عربية واضحة في حال وجود تعارض.
 */
export async function findSchedulingConflict(input: CreateSessionInput, excludeSessionId?: string) {
  const sameDaySessions = await prisma.session.findMany({
    where: {
      date: input.date,
      status: { not: "CANCELLED" },
      id: excludeSessionId ? { not: excludeSessionId } : undefined,
      OR: [
        { teacherId: input.teacherId },
        {
          levelId: input.levelId,
          streamId: input.streamId ?? null,
        },
      ],
    },
    include: { teacher: true, subject: true },
  });

  for (const existing of sameDaySessions) {
    if (timeRangesOverlap(input.startTime, input.endTime, existing.startTime, existing.endTime)) {
      if (existing.teacherId === input.teacherId) {
        return `يوجد تعارض في التوقيت: لديك حصة مبرمجة بالفعل من الساعة ${existing.startTime} إلى ${existing.endTime}.`;
      }
      return `يوجد تعارض في التوقيت: توجد حصة أخرى لنفس المستوى/الشعبة من الساعة ${existing.startTime} إلى ${existing.endTime} (الأستاذ: ${existing.teacher.fullName}).`;
    }
  }

  return null;
}

export async function createSession(input: CreateSessionInput) {
  if (!isDateAllowedForNewSession(input.date)) {
    throw new AppError(400, "لا يمكن اختيار تاريخ سابق أو من الأسبوع الحالي. التواريخ المتاحة تبدأ من الأسبوع المقبل فقط.");
  }

  const durationMin = computeDurationMinutes(input.startTime, input.endTime);

  const conflictMessage = await findSchedulingConflict(input);
  if (conflictMessage) {
    throw new AppError(409, conflictMessage);
  }

  try {
    const meeting = generateMeeting();
    return await prisma.session.create({
      data: {
        teacherId: input.teacherId,
        levelId: input.levelId,
        streamId: input.streamId ?? null,
        subjectId: input.subjectId,
        title: input.title,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        durationMin,
        schoolYearId: input.schoolYearId,
        status: "PROPOSED",
        meetingLink: meeting.link,
        meetingProvider: meeting.provider,
      },
      include: { teacher: true, level: true, stream: true, subject: true },
    });
  } catch (err: any) {
    // قيد فريد على مستوى قاعدة البيانات (teacherId + date + startTime) كخط دفاع أخير
    if (err?.code === "P2002") {
      throw new AppError(409, "يوجد تعارض في التوقيت. توجد حصة مبرمجة بنفس التاريخ والتوقيت.");
    }
    throw err;
  }
}

/**
 * إصلاح ذاتي: أي حصة سابقة أُنشئت قبل تفعيل التوليد التلقائي لرابط Jitsi (أو
 * فقدت رابطها لأي سبب) تحصل على رابط تلقائيًا في أول مرة تُعرض فيها، دون أي
 * تدخل يدوي. يُستدعى من كل نقطة تُرجع حصصًا للعرض (استعمال الزمن، حصصي، لائحة
 * الحصص، الدروس المتاحة).
 */
export async function ensureMeetingLinks<T extends { id: string; meetingLink: string | null; status: string }>(
  sessions: T[]
): Promise<T[]> {
  const missing = sessions.filter((s) => !s.meetingLink && s.status !== "CANCELLED");
  if (missing.length === 0) return sessions;

  const updatedById = new Map<string, string>();
  for (const s of missing) {
    const meeting = generateMeeting();
    await prisma.session.update({
      where: { id: s.id },
      data: { meetingLink: meeting.link, meetingProvider: meeting.provider },
    });
    updatedById.set(s.id, meeting.link);
  }

  return sessions.map((s) => (updatedById.has(s.id) ? { ...s, meetingLink: updatedById.get(s.id)! } : s));
}

import { prisma } from "../lib/prisma";
import { sendMail } from "../lib/mailer";
import { buildTeacherReminderEmail, buildStudentReminderEmail } from "../lib/emailTemplates";

/**
 * يبحث عن الحصص المبرمجة/المقبولة التي تقع بعد 24 ساعة تقريبًا ولم يُرسَل لها
 * تذكير بعد، ثم يرسل بريدًا للأستاذ ولكل التلاميذ المسجلين، ويعلّم الحصة كمُرسَلة
 * (reminderSent) لتفادي التكرار عند إعادة تشغيل المهمة المجدولة (Cron).
 */
export async function sendUpcomingSessionReminders(): Promise<number> {
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setHours(windowStart.getHours() + 23);
  const windowEnd = new Date(now);
  windowEnd.setHours(windowEnd.getHours() + 25);

  const sessions = await prisma.session.findMany({
    where: {
      date: { gte: windowStart, lte: windowEnd },
      status: { in: ["APPROVED", "SCHEDULED"] },
      reminderSent: false,
    },
    include: {
      teacher: true,
      level: true,
      stream: true,
      subject: true,
      enrollments: true,
    },
  });

  for (const session of sessions) {
    const teacherMail = buildTeacherReminderEmail(session);
    await sendMail({ to: session.teacher.email, subject: teacherMail.subject, html: teacherMail.html });

    for (const enrollment of session.enrollments) {
      const studentMail = buildStudentReminderEmail(session);
      await sendMail({ to: enrollment.email, subject: studentMail.subject, html: studentMail.html });
    }

    await prisma.session.update({ where: { id: session.id }, data: { reminderSent: true } });
  }

  return sessions.length;
}

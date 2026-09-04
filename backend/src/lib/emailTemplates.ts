interface SessionForEmail {
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  meetingLink: string | null;
  level: { name: string };
  stream: { name: string } | null;
  subject: { name: string };
  teacher: { fullName: string };
}

function formatArDate(d: Date): string {
  return d.toLocaleDateString("ar-MA", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
}

export function buildTeacherReminderEmail(session: SessionForEmail) {
  const subject = `تذكير: حصتك "${session.title}" غدًا`;
  const html = `
    <div dir="rtl" style="font-family: Tajawal, Arial, sans-serif;">
      <h2>تذكير بحصة دعم تربوي عن بعد</h2>
      <p>لديك حصة مبرمجة غدًا:</p>
      <ul>
        <li><b>الدرس:</b> ${session.title}</li>
        <li><b>المستوى:</b> ${session.level.name}${session.stream ? " — " + session.stream.name : ""}</li>
        <li><b>المادة:</b> ${session.subject.name}</li>
        <li><b>التاريخ:</b> ${formatArDate(session.date)}</li>
        <li><b>التوقيت:</b> من ${session.startTime} إلى ${session.endTime}</li>
        ${session.meetingLink ? `<li><b>رابط اللقاء:</b> <a href="${session.meetingLink}">${session.meetingLink}</a></li>` : ""}
      </ul>
      <p>مصلحة التعلم والتكوين عن بعد — الأكاديمية الجهوية للتربية والتكوين مراكش آسفي</p>
    </div>`;
  return { subject, html };
}

export function buildStudentReminderEmail(session: SessionForEmail) {
  const subject = `تذكير: حصة "${session.title}" غدًا`;
  const html = `
    <div dir="rtl" style="font-family: Tajawal, Arial, sans-serif;">
      <h2>تذكير بحصة دعم تربوي عن بعد</h2>
      <p>لديك حصة مبرمجة غدًا:</p>
      <ul>
        <li><b>الدرس:</b> ${session.title}</li>
        <li><b>الأستاذ:</b> ${session.teacher.fullName}</li>
        <li><b>المادة:</b> ${session.subject.name}</li>
        <li><b>التاريخ:</b> ${formatArDate(session.date)}</li>
        <li><b>التوقيت:</b> من ${session.startTime} إلى ${session.endTime}</li>
        ${session.meetingLink ? `<li><b>رابط الدخول:</b> <a href="${session.meetingLink}">${session.meetingLink}</a></li>` : ""}
      </ul>
      <p>مصلحة التعلم والتكوين عن بعد — الأكاديمية الجهوية للتربية والتكوين مراكش آسفي</p>
    </div>`;
  return { subject, html };
}

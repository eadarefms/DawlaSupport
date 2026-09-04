import { randomUUID } from "crypto";

export interface GeneratedMeeting {
  link: string;
  provider: "JITSI" | "TEAMS" | "GOOGLE_MEET" | "MANUAL";
}

export interface MeetingProvider {
  generate(): GeneratedMeeting;
}

/**
 * Jitsi Meet: لا يتطلب أي حساب أو مفتاح API أو بطاقة بنكية — مجرد رابط بمعرّف
 * فريد وغير قابل للتخمين ينشئ الغرفة تلقائيًا عند أول دخول إليها. هذا ما يجعله
 * الخيار الافتراضي المناسب لشرط "كل الأدوات مجانية بدون بطاقة بنكية".
 */
class JitsiMeetingProvider implements MeetingProvider {
  generate(): GeneratedMeeting {
    const slug = randomUUID().replace(/-/g, "").slice(0, 16);
    return { link: `https://meet.jit.si/Soutien-${slug}`, provider: "JITSI" };
  }
}

/**
 * نقطة توسّع مستقبلية: تكامل حقيقي مع Microsoft Teams عبر Graph API
 * (يتطلب تسجيل تطبيق Azure AD وموافقة إدارية من المؤسسة — غير مُفعَّل حاليًا).
 * عند توفره، يكفي تبديل QUEUED_PROVIDER أدناه دون تغيير أي كود آخر في المشروع.
 */
// class TeamsMeetingProvider implements MeetingProvider { ... }

const activeProvider: MeetingProvider = new JitsiMeetingProvider();

export function generateMeeting(): GeneratedMeeting {
  return activeProvider.generate();
}

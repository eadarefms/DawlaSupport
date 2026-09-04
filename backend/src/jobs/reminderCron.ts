import cron from "node-cron";
import { sendUpcomingSessionReminders } from "../services/reminder.service";

/**
 * يشغّل التحقق من التذكيرات كل ساعة (نافذة 23-25 ساعة تضمن عدم تفويت أي حصة
 * حتى لو تعطلت المهمة لفترة قصيرة). قابل للتوسع لاحقًا بمهام أخرى (تذكير قبل
 * ساعة، تنظيف الإشعارات القديمة، إلخ.).
 */
export function startCronJobs() {
  cron.schedule("0 * * * *", async () => {
    try {
      const count = await sendUpcomingSessionReminders();
      if (count > 0) {
        console.log(`⏰  تم إرسال تذكيرات لـ ${count} حصة/حصص`);
      }
    } catch (err) {
      console.error("خطأ في مهمة التذكير المجدولة:", err);
    }
  });

  console.log("🕐  تم تشغيل المهام المجدولة (تذكير الحصص كل ساعة)");
}

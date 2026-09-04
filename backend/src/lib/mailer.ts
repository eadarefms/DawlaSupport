import nodemailer, { Transporter } from "nodemailer";
import { env } from "../config/env";

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface MailProvider {
  send(message: MailMessage): Promise<void>;
}

/**
 * مزود بريد عبر SMTP (Gmail App Password، Brevo، Mailtrap، إلخ). قابل للتغيير
 * بالكامل عبر متغيرات البيئة EMAIL_HOST/EMAIL_USER/EMAIL_PASSWORD دون تعديل الكود.
 */
class SmtpMailProvider implements MailProvider {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.port === 465,
      auth: env.email.user ? { user: env.email.user, pass: env.email.password } : undefined,
    });
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: env.email.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
    });
  }
}

/** مزود وهمي: يطبع الرسالة في السجل بدل إرسالها فعليًا — يُستعمل عند عدم إعداد SMTP */
class ConsoleMailProvider implements MailProvider {
  async send(message: MailMessage): Promise<void> {
    console.log("📧  [بريد وهمي — لم يُضبط مزود SMTP بعد]");
    console.log(`   إلى: ${message.to}`);
    console.log(`   الموضوع: ${message.subject}`);
  }
}

function buildProvider(): MailProvider {
  if (env.email.provider === "smtp" && env.email.host) {
    return new SmtpMailProvider();
  }
  return new ConsoleMailProvider();
}

const provider = buildProvider();

export async function sendMail(message: MailMessage): Promise<void> {
  try {
    await provider.send(message);
  } catch (err) {
    // لا نُفشل العملية الرئيسية (مثل إنشاء الحصة) بسبب خطأ في إرسال البريد
    console.error("فشل إرسال البريد الإلكتروني:", err);
  }
}

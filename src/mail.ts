import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'KuroNeko <noreply@example.com>';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${APP_URL}/reset-password?token=${token}`;
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: 'إعادة تعيين كلمة المرور - KuroNeko',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>إعادة تعيين كلمة المرور</h2>
        <p>اضغط على الرابط أدناه لإنشاء كلمة مرور جديدة:</p>
        <a href="${url}" style="background:#2DD4BF;color:#060708;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">إعادة التعيين</a>
        <p style="color:#888;font-size:12px;margin-top:16px;">الرابط صالح لمدة ساعة واحدة. إذا لم تطلب هذا، تجاهل الرسالة.</p>
      </div>
    `,
  });
}

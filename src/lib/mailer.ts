import nodemailer from "nodemailer";

type SendArgs = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
};

const host = process.env.BREVO_SMTP_HOST;
const port = Number(process.env.BREVO_SMTP_PORT);
const user = process.env.BREVO_SMTP_USER || "";
const pass = process.env.BREVO_SMTP_PASS || "";

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, 
  auth: { user, pass },
});

export async function sendMail({ to, subject, text, html, replyTo }: SendArgs) {
  const fromName = process.env.MAIL_FROM_NAME;
  const fromEmail = process.env.MAIL_FROM_EMAIL;

  const info = await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject,
    ...(html ? { html } : {}),
    ...(text ? { text } : {}),
    ...(replyTo ? { replyTo } : {}),
  });

  return info;
}
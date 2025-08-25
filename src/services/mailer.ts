import nodemailer from "nodemailer";

const host = process.env.BREVO_SMTP_HOST!;
const port = Number(process.env.BREVO_SMTP_PORT || 587);
const user = process.env.BREVO_SMTP_USER!;
const pass = process.env.BREVO_SMTP_PASS!;

const DEFAULT_FROM =
  process.env.MAIL_FROM_EMAIL
    ? `${process.env.MAIL_FROM_NAME || "GottaSpeak"} <${process.env.MAIL_FROM_EMAIL}>`
    : "GottaSpeak <hello@gottaspeak.com>";

export const mailer = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
});

export function sendMail(opts: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}) {
  return mailer.sendMail({
    from: opts.from || DEFAULT_FROM,
    to: opts.to,
    subject: opts.subject,
    ...(opts.html ? { html: opts.html } : {}),
    ...(opts.text ? { text: opts.text } : {}),
    ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
  });
}

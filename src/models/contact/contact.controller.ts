import type { Request, Response } from "express";
import { z } from "zod";
import { sendMail } from "../../services/mailer";

const bodySchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  message: z.string().min(1).max(2000),
  subject: z.string().max(120).optional(),
});

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

export async function sendContactMessage(req: Request, res: Response) {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid data" });
  }

  const { name, email, message, subject } = parsed.data;
  const to = process.env.MAIL_TO_SUPPORT || "support@gottaspeak.com";

  await sendMail({
    to,
    subject: subject || `Contact form: ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
    html: `<p><b>From:</b> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
           <pre style="font-family:inherit;white-space:pre-wrap">${escapeHtml(message)}</pre>`,
    replyTo: `${name} <${email}>`,
  });

  res.status(202).json({ ok: true });
}

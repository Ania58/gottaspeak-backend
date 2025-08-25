import type { Request, Response } from "express";
import { z } from "zod";
import { sendMail } from "../../services/mailer";
import { SupportMailModel } from "./support-mail.model";

const contactSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(3),
  userId: z.string().optional(),
  channel: z.enum(["hello", "support"]).optional().default("support"),
});

export async function contactSupport(req: Request, res: Response) {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });

  const { email, name, subject, message, userId, channel } = parsed.data;

  const helloTo   = process.env.MAIL_FROM_EMAIL  || "hello@gottaspeak.com";
  const supportTo = process.env.MAIL_TO_SUPPORT  || "support@gottaspeak.com";
  const toAddr    = channel === "hello" ? helloTo : supportTo;
  const subj = subject || "New message";

  const log = await SupportMailModel.create({
    direction: "outgoing",
    to: [supportTo],
    from: email,
    subject: `GottaSpeak: ${subj}`,
    text: message,
    userId,
    status: "queued",
  });

  try {
    await sendMail({
      to: toAddr,
      subject: `GottaSpeak: ${subj}`,
      html: `
        <p><b>From:</b> ${name || "-"} &lt;${email}&gt;</p>
        ${userId ? `<p><b>userId:</b> ${userId}</p>` : ""}
        <pre style="white-space:pre-wrap;font:inherit">${message}</pre>
      `,
      replyTo: email,
    });
    await SupportMailModel.findByIdAndUpdate(log._id, { status: "sent" });
  } catch (e: any) {
    await SupportMailModel.findByIdAndUpdate(log._id, { status: "failed", error: String(e?.message || e) });
  }

  const autoSubject = channel === "hello"
    ? "Thanks for your message"
    : "We received your support request";

  const autoHtml = channel === "hello"
    ? `<p>Thanks for reaching out! We’ll get back to you soon.</p>`
    : `<p>Thanks for your message. We've logged your support request and will reply shortly.</p>`;

   try {
    await SupportMailModel.create({
      direction: "outgoing",
      to: [email],
      from: toAddr,
      subject: autoSubject,
      text: autoHtml.replace(/<[^>]+>/g, ""),
      userId,
      status: "queued",
    });

    await sendMail({
      to: email,
      subject: autoSubject,
      html: autoHtml,
      replyTo: toAddr,
    });

    await SupportMailModel.updateOne(
      { to: [email], subject: "Thanks for your message", status: "queued" },
      { $set: { status: "sent" } }
    );
  } catch {
  }

  return res.json({ ok: true });
}

const adminSendSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1),
  html: z.string().optional(),
  text: z.string().optional(),
  userId: z.string().optional(),
  replyTo: z.string().email().optional(),
});

export async function adminSendSupportMail(req: Request, res: Response) {
  const token = req.header("x-admin-token");
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const parsed = adminSendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });

  const data = parsed.data;
  const to = Array.isArray(data.to) ? data.to : [data.to];

  const supportFrom = process.env.SUPPORT_EMAIL || "support@gottaspeak.com";

  const log = await SupportMailModel.create({
    direction: "outgoing",
    to,
    from: supportFrom,
    subject: data.subject,
    text: data.text || "",
    html: data.html || "",
    userId: data.userId,
    status: "queued",
  });

  try {
    await sendMail({
      to,
      subject: data.subject,
      html: data.html || (data.text ? `<pre>${data.text}</pre>` : "<p></p>"),
      replyTo: data.replyTo || supportFrom,
      from: `GottaSpeak Support <${supportFrom}>`,
    });
    await SupportMailModel.findByIdAndUpdate(log._id, { status: "sent" });
    return res.json({ ok: true });
  } catch (e: any) {
    await SupportMailModel.findByIdAndUpdate(log._id, { status: "failed", error: String(e?.message || e) });
    return res.status(500).json({ error: "Send failed" });
  }
}

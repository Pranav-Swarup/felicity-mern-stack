import nodemailer from "nodemailer";
import env from "../config/env.js";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!env.mail.user || !env.mail.pass) {
    console.warn("Mail credentials not set — emails will be skipped");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.port === 465,
    auth: {
      user: env.mail.user,
      pass: env.mail.pass,
    },
  });

  return transporter;
}

export async function sendTicketEmail(participant, event, ticketId, qrDataUrl) {
  const t = getTransporter();
  if (!t) return;

  // strip the data URL prefix to get the base64 image
  const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, "");

  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #333;">Your Ticket for ${event.name}</h2>
      <p>Hi ${participant.firstName},</p>
      <p>You're registered! Here are your details:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 6px 0; color: #666;">Event</td><td style="padding: 6px 0; font-weight: bold;">${event.name}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Type</td><td style="padding: 6px 0;">${event.type}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Date</td><td style="padding: 6px 0;">${event.startDate ? new Date(event.startDate).toLocaleDateString() : "TBD"}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Ticket ID</td><td style="padding: 6px 0; font-family: monospace; font-weight: bold;">${ticketId}</td></tr>
      </table>
      <div style="text-align: center; margin: 20px 0;">
        <img src="cid:qrcode" alt="QR Code" style="width: 200px; height: 200px;" />
      </div>
      <p style="color: #888; font-size: 12px;">This is your entry pass. Please keep it safe.</p>
    </div>
  `;

  await t.sendMail({
    from: `"Felicity" <${env.mail.user}>`,
    to: participant.email,
    subject: `Ticket: ${event.name} — ${ticketId}`,
    html,
    attachments: [
      {
        filename: "qrcode.png",
        content: Buffer.from(qrBase64, "base64"),
        cid: "qrcode",
      },
    ],
  });
}

export async function sendPlainEmail(to, subject, htmlBody) {
  const t = getTransporter();
  if (!t) return;

  await t.sendMail({
    from: `"Felicity" <${env.mail.user}>`,
    to,
    subject,
    html: htmlBody,
  });
}

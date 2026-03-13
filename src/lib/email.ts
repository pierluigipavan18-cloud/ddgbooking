import { Resend } from "resend";
import { prisma } from "./prisma";

const FROM_EMAIL = process.env.EMAIL_FROM || "ddgBooking <noreply@ddg.solutions>";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      await prisma.emailLog.create({
        data: { to, subject, status: "failed", error: JSON.stringify(error) },
      });
      return { success: false, error };
    }

    await prisma.emailLog.create({
      data: { to, subject, status: "sent", sentAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    await prisma.emailLog.create({
      data: { to, subject, status: "failed", error: String(error) },
    });
    return { success: false, error };
  }
}

export function buildBookingConfirmationEmail(booking: {
  guestName: string;
  agentName: string;
  startTime: Date;
  meetLink?: string | null;
}) {
  const date = booking.startTime.toLocaleDateString("it-IT", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Europe/Rome",
  });
  const time = booking.startTime.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  });

  return {
    subject: `Conferma appuntamento - ${date} alle ${time}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="text-align: center; padding: 24px 0; border-bottom: 2px solid #0066FF;">
    <h1 style="margin: 0; color: #0066FF; font-size: 24px;">ddgBooking</h1>
    <p style="margin: 4px 0 0; color: #666; font-size: 12px;">by fotonik</p>
  </div>

  <div style="padding: 32px 0;">
    <h2 style="color: #1a1a1a; margin: 0 0 16px;">Ciao ${booking.guestName}!</h2>
    <p style="color: #444; line-height: 1.6;">Il tuo appuntamento è confermato.</p>

    <div style="background: #f7f9fc; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <p style="margin: 0 0 8px;"><strong>Data:</strong> ${date}</p>
      <p style="margin: 0 0 8px;"><strong>Ora:</strong> ${time}</p>
      <p style="margin: 0 0 8px;"><strong>Con:</strong> ${booking.agentName}</p>
      ${booking.meetLink ? `<p style="margin: 0;"><strong>Link:</strong> <a href="${booking.meetLink}" style="color: #0066FF;">${booking.meetLink}</a></p>` : ""}
    </div>

    <p style="color: #666; font-size: 14px; line-height: 1.6;">
      Riceverai un promemoria prima dell'appuntamento.<br>
      Se hai bisogno di cancellare o riprogrammare, rispondi a questa email.
    </p>
  </div>

  <div style="border-top: 1px solid #eee; padding: 16px 0; text-align: center;">
    <p style="color: #999; font-size: 12px; margin: 0;">
      DDG Solutions — Soluzioni di valore per l'energia<br>
      Powered by ddgBooking · by fotonik
    </p>
  </div>
</body>
</html>`,
  };
}

export function buildReminderEmail(booking: {
  guestName: string;
  agentName: string;
  startTime: Date;
  meetLink?: string | null;
}) {
  const date = booking.startTime.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Rome",
  });
  const time = booking.startTime.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  });

  return {
    subject: `Promemoria: appuntamento domani alle ${time}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="text-align: center; padding: 24px 0; border-bottom: 2px solid #0066FF;">
    <h1 style="margin: 0; color: #0066FF; font-size: 24px;">ddgBooking</h1>
  </div>

  <div style="padding: 32px 0;">
    <h2 style="color: #1a1a1a;">Ciao ${booking.guestName}!</h2>
    <p style="color: #444; line-height: 1.6;">
      Ti ricordiamo il tuo appuntamento di <strong>${date}</strong> alle <strong>${time}</strong> con <strong>${booking.agentName}</strong>.
    </p>

    ${booking.meetLink ? `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${booking.meetLink}" style="display: inline-block; background: #0066FF; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
        Partecipa alla videochiamata
      </a>
    </div>` : ""}

    <p style="color: #666; font-size: 14px;">Ci vediamo domani!</p>
  </div>

  <div style="border-top: 1px solid #eee; padding: 16px 0; text-align: center;">
    <p style="color: #999; font-size: 12px; margin: 0;">
      DDG Solutions · Powered by ddgBooking · by fotonik
    </p>
  </div>
</body>
</html>`,
  };
}

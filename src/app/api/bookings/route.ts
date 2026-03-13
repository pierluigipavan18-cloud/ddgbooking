import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendEmail, buildBookingConfirmationEmail } from "@/lib/email";
import {
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeDatetime,
} from "@/lib/sanitize";

// POST /api/bookings — Create a new booking (public)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Sanitize all inputs
    const bookingLinkId = sanitizeString(body.bookingLinkId);
    const agentId = sanitizeString(body.agentId);
    const startTime = sanitizeDatetime(body.startTime);
    const endTime = sanitizeDatetime(body.endTime);
    const guestName = sanitizeString(body.guestName);
    const guestEmail = sanitizeEmail(body.guestEmail);
    const guestPhone = sanitizePhone(body.guestPhone);
    const guestCompany = sanitizeString(body.guestCompany) || null;
    const notes = sanitizeString(body.notes) || null;
    const privacyConsent = body.privacyConsent === true;

    if (!bookingLinkId || !agentId || !startTime || !endTime || !guestName || !guestEmail) {
      return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 });
    }

    if (!privacyConsent) {
      return NextResponse.json(
        { error: "È necessario accettare l'informativa sulla privacy" },
        { status: 400 }
      );
    }

    // Validate time ordering
    if (new Date(startTime) >= new Date(endTime)) {
      return NextResponse.json(
        { error: "L'orario di fine deve essere dopo l'orario di inizio" },
        { status: 400 }
      );
    }

    // Verify the booking link and agent exist
    const link = await prisma.bookingLink.findUnique({ where: { id: bookingLinkId } });
    if (!link || !link.isActive) {
      return NextResponse.json({ error: "Link di prenotazione non valido" }, { status: 404 });
    }

    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent || !agent.isActive) {
      return NextResponse.json({ error: "Agente non disponibile" }, { status: 404 });
    }

    // Verify agent belongs to this booking link
    const agentLink = await prisma.bookingLinkAgent.findUnique({
      where: { bookingLinkId_agentId: { bookingLinkId, agentId } },
    });
    if (!agentLink) {
      return NextResponse.json({ error: "Agente non associato a questo link" }, { status: 400 });
    }

    // Check for conflicts
    const conflict = await prisma.booking.findFirst({
      where: {
        agentId,
        status: { not: "cancelled" },
        startTime: { lt: new Date(endTime) },
        endTime: { gt: new Date(startTime) },
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Questo orario non è più disponibile" },
        { status: 409 }
      );
    }

    // Create or find contact
    let contact = await prisma.contact.findFirst({
      where: { email: guestEmail, userId: link.userId },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          userId: link.userId,
          name: guestName,
          email: guestEmail,
          phone: guestPhone,
          company: guestCompany,
          source: "booking",
          privacyConsent,
          consentDate: new Date(),
        },
      });
    } else {
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          name: guestName,
          phone: guestPhone || contact.phone,
          company: guestCompany || contact.company,
          privacyConsent: privacyConsent || contact.privacyConsent,
          consentDate: privacyConsent ? new Date() : contact.consentDate,
        },
      });
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        bookingLinkId,
        agentId,
        contactId: contact.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        guestName,
        guestEmail,
        guestPhone,
        guestCompany,
        notes,
        privacyConsent,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        contactId: contact.id,
        type: "booking_created",
        content: `Prenotazione creata per ${new Date(startTime).toLocaleDateString("it-IT")} con ${agent.name}`,
      },
    });

    // Send confirmation email
    const emailData = buildBookingConfirmationEmail({
      guestName,
      agentName: agent.name,
      startTime: new Date(startTime),
      meetLink: booking.meetLink,
    });
    sendEmail(guestEmail, emailData.subject, emailData.html).catch(console.error);

    return NextResponse.json({ booking, contact }, { status: 201 });
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}

// GET /api/bookings — List bookings (authenticated)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const agentId = searchParams.get("agentId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {
    bookingLink: { userId: session.user.id },
  };

  if (status) where.status = status;
  if (agentId) where.agentId = agentId;
  if (from || to) {
    where.startTime = {};
    if (from) (where.startTime as Record<string, unknown>).gte = new Date(from);
    if (to) (where.startTime as Record<string, unknown>).lte = new Date(to);
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: { agent: true, bookingLink: true, contact: true },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(bookings);
}

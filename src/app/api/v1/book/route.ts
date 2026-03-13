import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildBookingConfirmationEmail } from "@/lib/email";

/**
 * POST /api/v1/book
 *
 * Public API for AI agents to create bookings programmatically.
 * Accepts the same data as the booking form but designed for API consumers.
 *
 * Body:
 * {
 *   "slug": "energia",
 *   "agentId": "abc123",
 *   "startTime": "2024-01-15T14:00:00Z",
 *   "endTime": "2024-01-15T14:30:00Z",
 *   "guest": {
 *     "name": "Mario Rossi",
 *     "email": "mario@example.com",
 *     "phone": "+39 333 1234567",
 *     "company": "Rossi Srl"
 *   },
 *   "notes": "Interested in photovoltaic installation",
 *   "privacyConsent": true
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, agentId, startTime, endTime, guest, notes, privacyConsent } = body;

    // Validate required fields
    if (!slug || !agentId || !startTime || !endTime || !guest?.name || !guest?.email) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["slug", "agentId", "startTime", "endTime", "guest.name", "guest.email"],
        },
        { status: 400 }
      );
    }

    if (!privacyConsent) {
      return NextResponse.json(
        { error: "Privacy consent is required (privacyConsent: true)" },
        { status: 400 }
      );
    }

    // Find the booking link
    const link = await prisma.bookingLink.findUnique({ where: { slug } });
    if (!link || !link.isActive) {
      return NextResponse.json({ error: "Booking link not found or inactive" }, { status: 404 });
    }

    // Check agent exists and is active
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, isActive: true },
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found or inactive" }, { status: 404 });
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
        { error: "Time slot is no longer available", code: "SLOT_TAKEN" },
        { status: 409 }
      );
    }

    // Create or update contact
    let contact = await prisma.contact.findFirst({
      where: { email: guest.email, userId: link.userId },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          userId: link.userId,
          name: guest.name,
          email: guest.email,
          phone: guest.phone,
          company: guest.company,
          source: "api",
          privacyConsent: true,
          consentDate: new Date(),
        },
      });
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        bookingLinkId: link.id,
        agentId,
        contactId: contact.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        guestName: guest.name,
        guestEmail: guest.email,
        guestPhone: guest.phone,
        guestCompany: guest.company,
        notes,
        privacyConsent: true,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        contactId: contact.id,
        type: "booking_created",
        content: `Prenotazione creata via API per ${new Date(startTime).toLocaleDateString("it-IT")} con ${agent.name}`,
      },
    });

    // Send confirmation email
    const emailData = buildBookingConfirmationEmail({
      guestName: guest.name,
      agentName: agent.name,
      startTime: new Date(startTime),
      meetLink: booking.meetLink,
    });
    sendEmail(guest.email, emailData.subject, emailData.html).catch(console.error);

    return NextResponse.json(
      {
        success: true,
        booking: {
          id: booking.id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          meetLink: booking.meetLink,
          agent: { id: agent.id, name: agent.name },
        },
        contact: { id: contact.id },
      },
      {
        status: 201,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Booking API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

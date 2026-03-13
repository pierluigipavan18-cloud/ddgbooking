import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildBookingConfirmationEmail } from "@/lib/email";
import {
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeDatetime,
  sanitizeSlug,
} from "@/lib/sanitize";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * POST /api/v1/book
 * Public API for AI agents to create bookings programmatically.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Sanitize all inputs
    const slug = sanitizeSlug(body.slug);
    const agentId = sanitizeString(body.agentId);
    const startTime = sanitizeDatetime(body.startTime);
    const endTime = sanitizeDatetime(body.endTime);
    const guestName = sanitizeString(body.guest?.name);
    const guestEmail = sanitizeEmail(body.guest?.email);
    const guestPhone = sanitizePhone(body.guest?.phone);
    const guestCompany = sanitizeString(body.guest?.company) || null;
    const notes = sanitizeString(body.notes) || null;
    const privacyConsent = body.privacyConsent === true;

    if (!slug || !agentId || !startTime || !endTime || !guestName || !guestEmail) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["slug", "agentId", "startTime", "endTime", "guest.name", "guest.email"],
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!privacyConsent) {
      return NextResponse.json(
        { error: "Privacy consent is required (privacyConsent: true)" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Validate time ordering
    if (new Date(startTime) >= new Date(endTime)) {
      return NextResponse.json(
        { error: "endTime must be after startTime" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Find the booking link
    const link = await prisma.bookingLink.findUnique({ where: { slug } });
    if (!link || !link.isActive) {
      return NextResponse.json(
        { error: "Booking link not found or inactive" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Check agent exists and is active
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, isActive: true },
    });
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found or inactive" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Verify agent belongs to this booking link
    const agentLink = await prisma.bookingLinkAgent.findUnique({
      where: { bookingLinkId_agentId: { bookingLinkId: link.id, agentId } },
    });
    if (!agentLink) {
      return NextResponse.json(
        { error: "Agent not assigned to this booking link" },
        { status: 400, headers: CORS_HEADERS }
      );
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
        { status: 409, headers: CORS_HEADERS }
      );
    }

    // Create or update contact
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
        guestName,
        guestEmail,
        guestPhone,
        guestCompany,
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
      guestName,
      agentName: agent.name,
      startTime: new Date(startTime),
      meetLink: booking.meetLink,
    });
    sendEmail(guestEmail, emailData.subject, emailData.html).catch(console.error);

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
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("Booking API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

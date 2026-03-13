import { NextRequest, NextResponse } from "next/server";
import { getSuggestedSlots } from "@/lib/availability";

/**
 * GET /api/v1/slots?slug=xxx&count=3
 *
 * Public API for AI agents (Plusvibe etc.) to fetch suggested time slots.
 * Returns human-friendly Italian messages ready to send to leads,
 * plus direct booking URLs for each suggestion.
 *
 * Example response:
 * {
 *   "suggestions": [
 *     {
 *       "message": "domani verso le 15:00 come suona?",
 *       "slot": { "start": "2024-01-15T14:00:00Z", "end": "2024-01-15T14:30:00Z" },
 *       "agentId": "abc123",
 *       "agentName": "Marco Rossi",
 *       "bookingUrl": "https://booking.ddg.solutions/book/energia?agent=abc123&date=2024-01-15&time=15:00"
 *     }
 *   ],
 *   "bookingLink": "https://booking.ddg.solutions/book/energia"
 * }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const count = parseInt(searchParams.get("count") || "3");

  if (!slug) {
    return NextResponse.json(
      {
        error: "slug parameter is required",
        usage: "GET /api/v1/slots?slug=your-booking-slug&count=3",
      },
      { status: 400 }
    );
  }

  try {
    const result = await getSuggestedSlots(slug, Math.min(count, 10));

    return NextResponse.json(result, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Slots API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

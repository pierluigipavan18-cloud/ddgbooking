import { prisma } from "./prisma";
import { addDays, startOfDay, format, addMinutes, isBefore, isAfter, parseISO } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

const TIMEZONE = "Europe/Rome";

interface TimeSlot {
  start: Date;
  end: Date;
}

interface BusySlot {
  start: string | null | undefined;
  end: string | null | undefined;
}

/**
 * Get available time slots for an agent on a specific date.
 */
export async function getAgentAvailability(
  agentId: string,
  date: Date,
  durationMinutes: number,
  existingBusySlots: BusySlot[] = []
): Promise<TimeSlot[]> {
  const zonedDate = toZonedTime(date, TIMEZONE);
  const dayOfWeek = zonedDate.getDay();

  // Get agent's configured availability for this day
  const availability = await prisma.availability.findMany({
    where: { agentId, dayOfWeek },
  });

  if (availability.length === 0) return [];

  // Get existing bookings for this agent on this date
  const dayStart = fromZonedTime(startOfDay(zonedDate), TIMEZONE);
  const dayEnd = fromZonedTime(addDays(startOfDay(zonedDate), 1), TIMEZONE);

  const bookings = await prisma.booking.findMany({
    where: {
      agentId,
      status: { not: "cancelled" },
      startTime: { gte: dayStart },
      endTime: { lte: dayEnd },
    },
  });

  // Combine booked slots and Google Calendar busy slots
  const busySlots: TimeSlot[] = [
    ...bookings.map((b) => ({ start: b.startTime, end: b.endTime })),
    ...existingBusySlots
      .filter((s) => s.start && s.end)
      .map((s) => ({ start: new Date(s.start!), end: new Date(s.end!) })),
  ];

  // Generate available slots
  const slots: TimeSlot[] = [];
  const now = new Date();

  for (const avail of availability) {
    const [startH, startM] = avail.startTime.split(":").map(Number);
    const [endH, endM] = avail.endTime.split(":").map(Number);

    const windowStart = fromZonedTime(
      new Date(zonedDate.getFullYear(), zonedDate.getMonth(), zonedDate.getDate(), startH, startM),
      TIMEZONE
    );
    const windowEnd = fromZonedTime(
      new Date(zonedDate.getFullYear(), zonedDate.getMonth(), zonedDate.getDate(), endH, endM),
      TIMEZONE
    );

    let cursor = windowStart;

    while (isBefore(addMinutes(cursor, durationMinutes), windowEnd) || addMinutes(cursor, durationMinutes).getTime() === windowEnd.getTime()) {
      const slotEnd = addMinutes(cursor, durationMinutes);

      // Skip if in the past
      if (isBefore(cursor, now)) {
        cursor = addMinutes(cursor, 15); // 15-min increments
        continue;
      }

      // Check for conflicts
      const hasConflict = busySlots.some(
        (busy) => isBefore(cursor, busy.end) && isAfter(slotEnd, busy.start)
      );

      if (!hasConflict) {
        slots.push({ start: cursor, end: slotEnd });
      }

      cursor = addMinutes(cursor, 15);
    }
  }

  return slots;
}

/**
 * Find the least busy agent for a booking link within the next 7 days.
 */
export async function findLeastBusyAgent(bookingLinkId: string): Promise<string | null> {
  const link = await prisma.bookingLink.findUnique({
    where: { id: bookingLinkId },
    include: {
      bookingLinkAgents: {
        include: { agent: true },
        where: { agent: { isActive: true } },
      },
    },
  });

  if (!link || link.bookingLinkAgents.length === 0) return null;

  const now = new Date();
  const weekFromNow = addDays(now, 7);

  // Count bookings per agent in the next 7 days
  const agentBookingCounts = await Promise.all(
    link.bookingLinkAgents.map(async (bla) => {
      const count = await prisma.booking.count({
        where: {
          agentId: bla.agentId,
          status: { not: "cancelled" },
          startTime: { gte: now, lte: weekFromNow },
        },
      });
      return { agentId: bla.agentId, count, priority: bla.priority };
    })
  );

  // Sort by booking count (ascending), then priority (ascending)
  agentBookingCounts.sort((a, b) => {
    if (a.count !== b.count) return a.count - b.count;
    return a.priority - b.priority;
  });

  return agentBookingCounts[0]?.agentId || null;
}

/**
 * Get suggested time slots for AI agents (Plusvibe integration).
 * Returns human-friendly Italian suggestions + booking data.
 */
export async function getSuggestedSlots(
  bookingLinkSlug: string,
  count: number = 3
): Promise<{
  suggestions: Array<{
    message: string;
    slot: TimeSlot;
    agentId: string;
    agentName: string;
    bookingUrl: string;
  }>;
  bookingLink: string;
}> {
  const link = await prisma.bookingLink.findUnique({
    where: { slug: bookingLinkSlug },
    include: {
      bookingLinkAgents: {
        include: { agent: true },
        where: { agent: { isActive: true } },
      },
    },
  });

  if (!link || link.bookingLinkAgents.length === 0) {
    return { suggestions: [], bookingLink: "" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const bookingLink = `${baseUrl}/book/${link.slug}`;
  const suggestions: Array<{
    message: string;
    slot: TimeSlot;
    agentId: string;
    agentName: string;
    bookingUrl: string;
  }> = [];

  // Check next 7 days
  for (let dayOffset = 0; dayOffset < 7 && suggestions.length < count; dayOffset++) {
    const date = addDays(new Date(), dayOffset);

    for (const bla of link.bookingLinkAgents) {
      if (suggestions.length >= count) break;

      const slots = await getAgentAvailability(bla.agentId, date, link.duration);

      for (const slot of slots) {
        if (suggestions.length >= count) break;

        const zonedStart = toZonedTime(slot.start, TIMEZONE);
        const dayName = format(zonedStart, "EEEE", { locale: undefined }); // We'll use Italian names
        const hour = format(zonedStart, "HH:mm");

        // Italian day names
        const italianDays: Record<string, string> = {
          Monday: "lunedì",
          Tuesday: "martedì",
          Wednesday: "mercoledì",
          Thursday: "giovedì",
          Friday: "venerdì",
          Saturday: "sabato",
          Sunday: "domenica",
        };

        const italianDay = italianDays[dayName] || dayName;
        const isToday = dayOffset === 0;
        const isTomorrow = dayOffset === 1;

        let timeRef: string;
        if (isToday) timeRef = "oggi";
        else if (isTomorrow) timeRef = "domani";
        else timeRef = italianDay;

        const message = `${timeRef} verso le ${hour} come suona?`;
        const bookingUrl = `${bookingLink}?agent=${bla.agentId}&date=${format(date, "yyyy-MM-dd")}&time=${hour}`;

        suggestions.push({
          message,
          slot,
          agentId: bla.agentId,
          agentName: bla.agent.name,
          bookingUrl,
        });
      }
    }
  }

  return { suggestions, bookingLink };
}

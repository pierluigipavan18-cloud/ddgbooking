import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgentAvailability, findLeastBusyAgent, getSuggestedSlots } from "@/lib/availability";
import { addDays } from "date-fns";

// GET /api/availability?slug=xxx&date=2024-01-15&agentId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const dateStr = searchParams.get("date");
  const agentId = searchParams.get("agentId");

  if (!slug) {
    return NextResponse.json({ error: "slug è obbligatorio" }, { status: 400 });
  }

  const link = await prisma.bookingLink.findUnique({
    where: { slug },
    include: {
      bookingLinkAgents: {
        include: { agent: true },
        where: { agent: { isActive: true } },
      },
    },
  });

  if (!link || !link.isActive) {
    return NextResponse.json({ error: "Link non trovato" }, { status: 404 });
  }

  // If no specific agent, find the least busy one
  let selectedAgentId = agentId;
  if (!selectedAgentId) {
    selectedAgentId = await findLeastBusyAgent(link.id);
  }

  if (!selectedAgentId) {
    return NextResponse.json({ error: "Nessun agente disponibile" }, { status: 404 });
  }

  // If specific date requested, return slots for that day
  if (dateStr) {
    const date = new Date(dateStr);
    const slots = await getAgentAvailability(selectedAgentId, date, link.duration);

    return NextResponse.json({
      agentId: selectedAgentId,
      agent: link.bookingLinkAgents.find((a) => a.agentId === selectedAgentId)?.agent,
      date: dateStr,
      slots: slots.map((s) => ({
        start: s.start.toISOString(),
        end: s.end.toISOString(),
      })),
      allAgents: link.bookingLinkAgents.map((a) => ({
        id: a.agent.id,
        name: a.agent.name,
        title: a.agent.title,
        avatar: a.agent.avatar,
        color: a.agent.color,
      })),
    });
  }

  // Return available dates for next 30 days
  const availableDates: string[] = [];
  for (let i = 0; i < 30; i++) {
    const date = addDays(new Date(), i);
    const slots = await getAgentAvailability(selectedAgentId, date, link.duration);
    if (slots.length > 0) {
      availableDates.push(date.toISOString().split("T")[0]);
    }
  }

  return NextResponse.json({
    agentId: selectedAgentId,
    agent: link.bookingLinkAgents.find((a) => a.agentId === selectedAgentId)?.agent,
    availableDates,
    duration: link.duration,
    allAgents: link.bookingLinkAgents.map((a) => ({
      id: a.agent.id,
      name: a.agent.name,
      title: a.agent.title,
      avatar: a.agent.avatar,
      color: a.agent.color,
    })),
  });
}

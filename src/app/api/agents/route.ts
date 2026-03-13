import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/agents — List agents (authenticated)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const agents = await prisma.agent.findMany({
    where: { userId: session.user.id },
    include: {
      availability: true,
      _count: {
        select: { bookings: { where: { status: { not: "cancelled" } } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(agents);
}

// POST /api/agents — Create agent
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, title, color, availability } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "Nome ed email sono obbligatori" }, { status: 400 });
  }

  const agent = await prisma.agent.create({
    data: {
      userId: session.user.id,
      name,
      email,
      title,
      color: color || "#0066FF",
      availability: availability
        ? {
            create: availability.map(
              (a: { dayOfWeek: number; startTime: string; endTime: string }) => ({
                dayOfWeek: a.dayOfWeek,
                startTime: a.startTime,
                endTime: a.endTime,
              })
            ),
          }
        : {
            // Default availability: Mon-Fri 9:00-18:00
            create: [1, 2, 3, 4, 5].map((day) => ({
              dayOfWeek: day,
              startTime: "09:00",
              endTime: "18:00",
            })),
          },
    },
    include: { availability: true },
  });

  return NextResponse.json(agent, { status: 201 });
}

// PUT /api/agents — Update agent
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const body = await req.json();
  const { id, name, email, title, color, isActive, availability } = body;

  if (!id) {
    return NextResponse.json({ error: "ID agente mancante" }, { status: 400 });
  }

  // Verify ownership
  const existing = await prisma.agent.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Agente non trovato" }, { status: 404 });
  }

  // Update agent
  const agent = await prisma.agent.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      ...(title !== undefined && { title }),
      ...(color && { color }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  // Update availability if provided
  if (availability) {
    await prisma.availability.deleteMany({ where: { agentId: id } });
    await prisma.availability.createMany({
      data: availability.map(
        (a: { dayOfWeek: number; startTime: string; endTime: string }) => ({
          agentId: id,
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
        })
      ),
    });
  }

  const updated = await prisma.agent.findUnique({
    where: { id },
    include: { availability: true },
  });

  return NextResponse.json(updated);
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/booking-links
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const links = await prisma.bookingLink.findMany({
    where: { userId: session.user.id },
    include: {
      bookingLinkAgents: { include: { agent: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(links);
}

// POST /api/booking-links
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const body = await req.json();
  const { slug, title, description, duration, theme, agentIds } = body;

  if (!slug || !title) {
    return NextResponse.json({ error: "Slug e titolo obbligatori" }, { status: 400 });
  }

  // Check slug uniqueness
  const existing = await prisma.bookingLink.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Questo slug è già in uso" }, { status: 409 });
  }

  const link = await prisma.bookingLink.create({
    data: {
      userId: session.user.id,
      slug,
      title,
      description,
      duration: duration || 30,
      theme: theme || "default",
      bookingLinkAgents: agentIds
        ? {
            create: agentIds.map((agentId: string, i: number) => ({
              agentId,
              priority: i,
            })),
          }
        : undefined,
    },
    include: {
      bookingLinkAgents: { include: { agent: true } },
    },
  });

  return NextResponse.json(link, { status: 201 });
}

// PUT /api/booking-links
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const body = await req.json();
  const { id, slug, title, description, duration, theme, isActive, agentIds } = body;

  if (!id) {
    return NextResponse.json({ error: "ID mancante" }, { status: 400 });
  }

  const existing = await prisma.bookingLink.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Non trovato" }, { status: 404 });
  }

  const link = await prisma.bookingLink.update({
    where: { id },
    data: {
      ...(slug && { slug }),
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(duration && { duration }),
      ...(theme && { theme }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  // Update agent assignments if provided
  if (agentIds) {
    await prisma.bookingLinkAgent.deleteMany({ where: { bookingLinkId: id } });
    await prisma.bookingLinkAgent.createMany({
      data: agentIds.map((agentId: string, i: number) => ({
        bookingLinkId: id,
        agentId,
        priority: i,
      })),
    });
  }

  return NextResponse.json(link);
}

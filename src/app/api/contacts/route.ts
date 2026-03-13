import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/contacts — List contacts (CRM)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: Record<string, unknown> = { userId: session.user.id };
  if (stage) where.stage = stage;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { company: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: {
        bookings: { orderBy: { startTime: "desc" }, take: 3 },
        activities: { orderBy: { createdAt: "desc" }, take: 5 },
        _count: { select: { bookings: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contact.count({ where }),
  ]);

  return NextResponse.json({ contacts, total, page, limit });
}

// POST /api/contacts — Create contact
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, phone, company, stage, notes, tags, source } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "Nome ed email sono obbligatori" }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: {
      userId: session.user.id,
      name,
      email,
      phone,
      company,
      stage: stage || "lead",
      notes,
      tags,
      source: source || "manual",
    },
  });

  return NextResponse.json(contact, { status: 201 });
}

// PUT /api/contacts — Update contact
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "ID contatto mancante" }, { status: 400 });
  }

  const existing = await prisma.contact.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Contatto non trovato" }, { status: 404 });
  }

  // Whitelist allowed fields — never spread raw body into DB
  const allowedStages = ["lead", "prospect", "customer", "churned"];
  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = String(body.name).slice(0, 200);
  if (body.email !== undefined) updateData.email = String(body.email).toLowerCase().trim().slice(0, 254);
  if (body.phone !== undefined) updateData.phone = body.phone ? String(body.phone).slice(0, 30) : null;
  if (body.company !== undefined) updateData.company = body.company ? String(body.company).slice(0, 200) : null;
  if (body.stage !== undefined && allowedStages.includes(body.stage)) updateData.stage = body.stage;
  if (body.notes !== undefined) updateData.notes = body.notes ? String(body.notes).slice(0, 5000) : null;
  if (body.tags !== undefined) updateData.tags = body.tags ? String(body.tags).slice(0, 500) : null;

  // If stage changed, log activity
  if (updateData.stage && updateData.stage !== existing.stage) {
    await prisma.activity.create({
      data: {
        contactId: id,
        type: "status_change",
        content: `Stato cambiato da "${existing.stage}" a "${updateData.stage}"`,
      },
    });
  }

  const contact = await prisma.contact.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(contact);
}

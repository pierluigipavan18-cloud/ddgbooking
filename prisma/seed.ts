import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user (Diego)
  const user = await prisma.user.upsert({
    where: { email: "diego@ddg.solutions" },
    update: {},
    create: {
      email: "diego@ddg.solutions",
      name: "Diego",
      password: "ddg2026!", // Change in production!
      role: "admin",
    },
  });

  // Create user settings
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      companyName: "DDG Solutions",
      timezone: "Europe/Rome",
      language: "it",
      brandColor: "#0066FF",
    },
  });

  // Create agents
  const agent1 = await prisma.agent.upsert({
    where: { id: "agent-diego" },
    update: {},
    create: {
      id: "agent-diego",
      userId: user.id,
      name: "Diego",
      email: "diego@ddg.solutions",
      title: "Consulente Energia Senior",
      color: "#0066FF",
    },
  });

  const agent2 = await prisma.agent.upsert({
    where: { id: "agent-marco" },
    update: {},
    create: {
      id: "agent-marco",
      userId: user.id,
      name: "Marco Rossi",
      email: "marco@ddg.solutions",
      title: "Consulente Fotovoltaico",
      color: "#059669",
    },
  });

  const agent3 = await prisma.agent.upsert({
    where: { id: "agent-giulia" },
    update: {},
    create: {
      id: "agent-giulia",
      userId: user.id,
      name: "Giulia Bianchi",
      email: "giulia@ddg.solutions",
      title: "Consulente Risparmio Energetico",
      color: "#7C3AED",
    },
  });

  // Create availability for all agents (Mon-Fri 9:00-18:00)
  for (const agent of [agent1, agent2, agent3]) {
    // Delete existing availability
    await prisma.availability.deleteMany({ where: { agentId: agent.id } });

    for (const day of [1, 2, 3, 4, 5]) {
      await prisma.availability.create({
        data: {
          agentId: agent.id,
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "18:00",
        },
      });
    }
  }

  // Create booking link
  const link = await prisma.bookingLink.upsert({
    where: { slug: "consulenza-energia" },
    update: {},
    create: {
      userId: user.id,
      slug: "consulenza-energia",
      title: "Consulenza Energia",
      description:
        "Prenota una consulenza gratuita con un nostro esperto per scoprire come risparmiare sulla bolletta e passare alle energie rinnovabili.",
      duration: 30,
      theme: "energia",
    },
  });

  // Assign agents to booking link
  await prisma.bookingLinkAgent.deleteMany({
    where: { bookingLinkId: link.id },
  });

  for (const [i, agent] of [agent1, agent2, agent3].entries()) {
    await prisma.bookingLinkAgent.create({
      data: {
        bookingLinkId: link.id,
        agentId: agent.id,
        priority: i,
      },
    });
  }

  // Create a second booking link
  const link2 = await prisma.bookingLink.upsert({
    where: { slug: "fotovoltaico" },
    update: {},
    create: {
      userId: user.id,
      slug: "fotovoltaico",
      title: "Consulenza Fotovoltaico",
      description:
        "Scopri quanto puoi risparmiare installando un impianto fotovoltaico. Consulenza gratuita e senza impegno.",
      duration: 45,
      theme: "forest",
    },
  });

  await prisma.bookingLinkAgent.deleteMany({
    where: { bookingLinkId: link2.id },
  });

  await prisma.bookingLinkAgent.create({
    data: {
      bookingLinkId: link2.id,
      agentId: agent2.id,
      priority: 0,
    },
  });

  // Create some sample contacts
  const sampleContacts = [
    { name: "Mario Rossi", email: "mario.rossi@example.com", phone: "+39 333 1234567", company: "Rossi Srl", stage: "lead" },
    { name: "Anna Verdi", email: "anna.verdi@example.com", phone: "+39 340 9876543", company: "Verdi Impianti", stage: "prospect" },
    { name: "Giuseppe Neri", email: "giuseppe.neri@example.com", phone: "+39 347 5555555", stage: "customer" },
  ];

  for (const contact of sampleContacts) {
    await prisma.contact.upsert({
      where: { id: `sample-${contact.email}` },
      update: {},
      create: {
        id: `sample-${contact.email}`,
        userId: user.id,
        ...contact,
        source: "manual",
        privacyConsent: true,
        consentDate: new Date(),
      },
    });
  }

  console.log("✅ Database seeded successfully!");
  console.log("");
  console.log("📋 Quick start:");
  console.log("   Login: diego@ddg.solutions / ddg2026!");
  console.log("   Booking page: http://localhost:3000/book/consulenza-energia");
  console.log("   Dashboard: http://localhost:3000/dashboard");
  console.log("");
  console.log("🤖 API for AI agents:");
  console.log("   GET /api/v1/slots?slug=consulenza-energia");
  console.log("   POST /api/v1/book");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

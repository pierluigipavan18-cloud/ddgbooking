import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BookingWidget } from "@/components/booking/BookingWidget";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ agent?: string; date?: string; time?: string }>;
}

export default async function BookingPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const link = await prisma.bookingLink.findUnique({
    where: { slug },
    include: {
      bookingLinkAgents: {
        include: { agent: true },
        where: { agent: { isActive: true } },
        orderBy: { priority: "asc" },
      },
      user: {
        include: { settings: true },
      },
    },
  });

  if (!link || !link.isActive) {
    notFound();
  }

  const agents = link.bookingLinkAgents.map((bla) => ({
    id: bla.agent.id,
    name: bla.agent.name,
    title: bla.agent.title,
    avatar: bla.agent.avatar,
    color: bla.agent.color,
  }));

  return (
    <BookingWidget
      bookingLink={{
        id: link.id,
        slug: link.slug,
        title: link.title,
        description: link.description,
        duration: link.duration,
        theme: link.theme,
      }}
      agents={agents}
      preselectedAgentId={sp.agent}
      preselectedDate={sp.date}
      preselectedTime={sp.time}
      companyName={link.user.settings?.companyName || "DDG Solutions"}
      brandColor={link.user.settings?.brandColor || "#0066FF"}
    />
  );
}

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * Root URL redirects to the default (first active) booking link.
 * ddgbooking.it → ddgbooking.it/book/consulenza-energia
 *
 * No landing page — this is Diego's booking tool, not a SaaS.
 */
export default async function HomePage() {
  // Find the first active booking link
  const defaultLink = await prisma.bookingLink.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (defaultLink) {
    redirect(`/book/${defaultLink.slug}`);
  }

  // Fallback: if no booking links exist yet (fresh install), send to login
  // so Diego can set things up
  redirect("/login");
}

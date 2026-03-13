import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format, startOfDay, endOfDay, addDays, startOfWeek, endOfWeek } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";
import { Calendar, Users, Link as LinkIcon, Clock, TrendingUp, AlertCircle } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  // Parallel data fetching
  const [
    todayBookings,
    weekBookings,
    totalContacts,
    newLeads,
    agents,
    bookingLinks,
    recentBookings,
  ] = await Promise.all([
    prisma.booking.count({
      where: {
        bookingLink: { userId },
        status: "confirmed",
        startTime: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.booking.count({
      where: {
        bookingLink: { userId },
        status: "confirmed",
        startTime: { gte: todayStart, lte: weekEnd },
      },
    }),
    prisma.contact.count({ where: { userId } }),
    prisma.contact.count({
      where: { userId, stage: "lead", createdAt: { gte: addDays(now, -7) } },
    }),
    prisma.agent.count({ where: { userId, isActive: true } }),
    prisma.bookingLink.count({ where: { userId, isActive: true } }),
    prisma.booking.findMany({
      where: { bookingLink: { userId } },
      include: { agent: true, bookingLink: true },
      orderBy: { startTime: "asc" },
      take: 10,
    }),
  ]);

  // Split into upcoming and past
  const upcomingBookings = recentBookings.filter(
    (b) => b.startTime >= now && b.status === "confirmed"
  );

  const stats = [
    {
      label: "Appuntamenti oggi",
      value: todayBookings,
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Questa settimana",
      value: weekBookings,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Contatti totali",
      value: totalContacts,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Nuovi lead (7gg)",
      value: newLeads,
      icon: AlertCircle,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Ciao{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}! 👋
        </h1>
        <p className="text-slate-500 mt-1">
          Ecco un riepilogo della tua attività.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Prossimi appuntamenti
            </h2>
            <Link href="/dashboard/calendar" className="text-sm text-[#0066FF] hover:underline">
              Vedi tutto
            </Link>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nessun appuntamento in programma</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="text-center min-w-[50px]">
                    <p className="text-xs font-medium text-slate-400 uppercase">
                      {format(booking.startTime, "EEE", { locale: it })}
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {format(booking.startTime, "d")}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {booking.guestName}
                    </p>
                    <p className="text-sm text-slate-500">
                      {format(booking.startTime, "HH:mm")} — {booking.bookingLink.title}
                    </p>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: booking.agent.color }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Azioni rapide
          </h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/agents"
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition-all"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Gestisci Agenti</p>
                <p className="text-sm text-slate-500">{agents} agenti attivi</p>
              </div>
            </Link>

            <Link
              href="/dashboard/crm"
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-purple-200 hover:bg-purple-50/50 transition-all"
            >
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">CRM Contatti</p>
                <p className="text-sm text-slate-500">{totalContacts} contatti nel database</p>
              </div>
            </Link>

            <Link
              href="/dashboard/settings"
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-green-200 hover:bg-green-50/50 transition-all"
            >
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Link di prenotazione</p>
                <p className="text-sm text-slate-500">{bookingLinks} link attivi</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

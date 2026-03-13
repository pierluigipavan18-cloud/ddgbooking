"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { it } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Video, User, XCircle } from "lucide-react";

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  status: string;
  meetLink: string | null;
  notes: string | null;
  agent: { id: string; name: string; color: string };
  bookingLink: { title: string };
}

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const from = weekStart.toISOString();
    const to = addDays(weekStart, 7).toISOString();
    const res = await fetch(`/api/bookings?from=${from}&to=${to}`);
    const data = await res.json();
    setBookings(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [weekStart]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const cancelBooking = async (id: string) => {
    if (!confirm("Sei sicuro di voler cancellare questo appuntamento?")) return;
    await fetch("/api/bookings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "cancelled" }),
    });
    fetchBookings();
    setSelectedBooking(null);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 - 19:00

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Calendario</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="px-4 py-2 text-sm font-medium text-[#0066FF] hover:bg-blue-50 rounded-lg"
          >
            Oggi
          </button>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-slate-700 min-w-[200px] text-center">
            {format(weekStart, "d MMM", { locale: it })} — {format(addDays(weekStart, 6), "d MMM yyyy", { locale: it })}
          </span>
        </div>
      </div>

      {/* Week Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-slate-200">
          <div className="p-3" />
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={`p-3 text-center border-l border-slate-100 ${isToday(day) ? "bg-blue-50" : ""}`}
            >
              <p className="text-xs font-medium text-slate-400 uppercase">
                {format(day, "EEE", { locale: it })}
              </p>
              <p className={`text-lg font-bold ${isToday(day) ? "text-[#0066FF]" : "text-slate-900"}`}>
                {format(day, "d")}
              </p>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="grid grid-cols-[80px_repeat(7,1fr)] min-h-[600px]">
          {hours.map((hour) => (
            <div key={hour} className="contents">
              <div className="p-2 text-right pr-4 text-xs text-slate-400 border-t border-slate-50 h-[60px]">
                {String(hour).padStart(2, "0")}:00
              </div>
              {weekDays.map((day) => {
                const dayBookings = bookings.filter((b) => {
                  const bDate = new Date(b.startTime);
                  return isSameDay(bDate, day) && bDate.getHours() === hour && b.status !== "cancelled";
                });

                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className={`border-l border-t border-slate-50 h-[60px] p-0.5 ${isToday(day) ? "bg-blue-50/30" : ""}`}
                  >
                    {dayBookings.map((booking) => (
                      <button
                        key={booking.id}
                        onClick={() => setSelectedBooking(booking)}
                        className="w-full text-left text-xs p-1.5 rounded-md text-white truncate"
                        style={{ backgroundColor: booking.agent.color }}
                      >
                        <span className="font-medium">{format(new Date(booking.startTime), "HH:mm")}</span>{" "}
                        {booking.guestName}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Dettaglio appuntamento</h3>
              <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900">{selectedBooking.guestName}</p>
                  <p className="text-sm text-slate-500">{selectedBooking.guestEmail}</p>
                  {selectedBooking.guestPhone && (
                    <p className="text-sm text-slate-500">{selectedBooking.guestPhone}</p>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm text-slate-700">
                  <strong>{format(new Date(selectedBooking.startTime), "EEEE d MMMM yyyy", { locale: it })}</strong>
                </p>
                <p className="text-sm text-slate-600">
                  {format(new Date(selectedBooking.startTime), "HH:mm")} — {format(new Date(selectedBooking.endTime), "HH:mm")}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Con: {selectedBooking.agent.name} · {selectedBooking.bookingLink.title}
                </p>
              </div>

              {selectedBooking.meetLink && (
                <a
                  href={selectedBooking.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#0066FF] hover:underline text-sm"
                >
                  <Video className="w-4 h-4" />
                  Apri Google Meet
                </a>
              )}

              {selectedBooking.notes && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Note</p>
                  <p className="text-sm text-slate-500">{selectedBooking.notes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              {selectedBooking.status === "confirmed" && (
                <button
                  onClick={() => cancelBooking(selectedBooking.id)}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
                >
                  Cancella appuntamento
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

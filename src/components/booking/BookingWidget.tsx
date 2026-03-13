"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, isBefore, startOfDay, addMinutes } from "date-fns";
import { it } from "date-fns/locale";
import { Clock, Globe, ChevronLeft, ChevronRight, User, Check, ArrowLeft, Loader2 } from "lucide-react";
import { themes, ThemeKey } from "@/lib/themes";
import { BookingForm } from "./BookingForm";
import { BookingConfirmation } from "./BookingConfirmation";

interface Agent {
  id: string;
  name: string;
  title: string | null;
  avatar: string | null;
  color: string;
}

interface BookingLink {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  duration: number;
  theme: string;
}

interface TimeSlot {
  start: string;
  end: string;
}

type Step = "calendar" | "time" | "form" | "confirmed";

interface BookingWidgetProps {
  bookingLink: BookingLink;
  agents: Agent[];
  preselectedAgentId?: string;
  preselectedDate?: string;
  preselectedTime?: string;
  companyName: string;
  brandColor: string;
}

export function BookingWidget({
  bookingLink,
  agents,
  preselectedAgentId,
  preselectedDate,
  preselectedTime,
  companyName,
  brandColor,
}: BookingWidgetProps) {
  const theme = themes[(bookingLink.theme as ThemeKey) || "default"] || themes.default;

  const [step, setStep] = useState<Step>("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedAgent, setSelectedAgent] = useState<Agent>(
    agents.find((a) => a.id === preselectedAgentId) || agents[0]
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    preselectedDate ? new Date(preselectedDate) : null
  );
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showAgentSwitcher, setShowAgentSwitcher] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    guestName: string;
    meetLink?: string;
  } | null>(null);

  // Fetch available dates
  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/availability?slug=${bookingLink.slug}&agentId=${selectedAgent.id}`
      );
      const data = await res.json();
      setAvailableDates(data.availableDates || []);
    } catch (e) {
      console.error("Failed to fetch availability:", e);
    }
    setLoading(false);
  }, [bookingLink.slug, selectedAgent.id]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Fetch time slots for selected date
  useEffect(() => {
    if (!selectedDate) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const res = await fetch(
          `/api/availability?slug=${bookingLink.slug}&agentId=${selectedAgent.id}&date=${dateStr}`
        );
        const data = await res.json();
        setTimeSlots(data.slots || []);
      } catch (e) {
        console.error("Failed to fetch slots:", e);
      }
      setLoadingSlots(false);
    };

    fetchSlots();
  }, [selectedDate, bookingLink.slug, selectedAgent.id]);

  // Auto-select preselected time
  useEffect(() => {
    if (preselectedTime && timeSlots.length > 0) {
      const match = timeSlots.find((s) => {
        const slotTime = format(new Date(s.start), "HH:mm");
        return slotTime === preselectedTime;
      });
      if (match) {
        setSelectedSlot(match);
        setStep("form");
      }
    }
  }, [preselectedTime, timeSlots]);

  // Calendar rendering
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart); // 0=Sun
  // Adjust for Monday start: Mon=0, Tue=1, ..., Sun=6
  const startOffset = startDay === 0 ? 6 : startDay - 1;

  const dayHeaders = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

  const isDateAvailable = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return availableDates.includes(dateStr);
  };

  const handleDateClick = (date: Date) => {
    if (!isDateAvailable(date)) return;
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep("time");
  };

  const handleSlotClick = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep("form");
  };

  const handleBookingComplete = (result: { guestName: string; meetLink?: string }) => {
    setBookingResult(result);
    setStep("confirmed");
  };

  const handleBack = () => {
    if (step === "time") {
      setSelectedDate(null);
      setStep("calendar");
    } else if (step === "form") {
      setSelectedSlot(null);
      setStep("time");
    }
  };

  return (
    <div
      className={`min-h-screen ${theme.background} flex items-center justify-center p-4`}
      style={theme.css as React.CSSProperties}
    >
      <div className="w-full max-w-4xl">
        {/* Main Card — Calendly-style split layout */}
        <div
          className={`${theme.cardBg} rounded-2xl shadow-xl shadow-black/5 overflow-hidden border ${theme.border}`}
        >
          <div className="flex flex-col md:flex-row min-h-[560px]">
            {/* Left Panel — Event Info */}
            <div
              className={`md:w-[320px] p-8 border-b md:border-b-0 md:border-r ${theme.border} flex flex-col`}
            >
              {/* Agent switcher (top right on mobile, inline on desktop) */}
              {agents.length > 1 && (
                <div className="relative mb-6">
                  <button
                    onClick={() => setShowAgentSwitcher(!showAgentSwitcher)}
                    className={`flex items-center gap-2 text-sm ${theme.textMuted} hover:opacity-80 transition-opacity ml-auto md:ml-0`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: selectedAgent.color }}
                    >
                      {selectedAgent.name.charAt(0)}
                    </div>
                    <span>Cambia consulente</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${showAgentSwitcher ? "rotate-90" : ""}`} />
                  </button>

                  {showAgentSwitcher && (
                    <div className={`absolute top-full left-0 mt-2 w-64 ${theme.cardBg} rounded-xl border ${theme.border} shadow-lg z-50 overflow-hidden fade-in`}>
                      {agents.map((agent) => (
                        <button
                          key={agent.id}
                          onClick={() => {
                            setSelectedAgent(agent);
                            setShowAgentSwitcher(false);
                            setSelectedDate(null);
                            setSelectedSlot(null);
                            setStep("calendar");
                          }}
                          className={`w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors ${
                            agent.id === selectedAgent.id ? "bg-slate-50" : ""
                          }`}
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: agent.color }}
                          >
                            {agent.name.charAt(0)}
                          </div>
                          <div className="text-left">
                            <p className={`font-medium text-sm ${theme.text}`}>{agent.name}</p>
                            {agent.title && (
                              <p className={`text-xs ${theme.textMuted}`}>{agent.title}</p>
                            )}
                          </div>
                          {agent.id === selectedAgent.id && (
                            <Check className="w-4 h-4 ml-auto" style={{ color: brandColor }} />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Company name */}
              <p className={`text-sm font-medium ${theme.textMuted} mb-1`}>
                {companyName}
              </p>

              {/* Event title */}
              <h1 className={`text-2xl font-bold ${theme.text} mb-3`}>
                {bookingLink.title}
              </h1>

              {/* Duration */}
              <div className={`flex items-center gap-2 ${theme.textMuted} text-sm mb-2`}>
                <Clock className="w-4 h-4" />
                <span>{bookingLink.duration} minuti</span>
              </div>

              {/* Timezone */}
              <div className={`flex items-center gap-2 ${theme.textMuted} text-sm mb-4`}>
                <Globe className="w-4 h-4" />
                <span>Fuso orario: Europa/Roma</span>
              </div>

              {/* Description */}
              {bookingLink.description && (
                <p className={`text-sm ${theme.textMuted} leading-relaxed mb-4`}>
                  {bookingLink.description}
                </p>
              )}

              {/* Selected agent info */}
              <div className="mt-auto pt-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                    style={{ backgroundColor: selectedAgent.color }}
                  >
                    {selectedAgent.name.charAt(0)}
                  </div>
                  <div>
                    <p className={`font-semibold ${theme.text}`}>{selectedAgent.name}</p>
                    {selectedAgent.title && (
                      <p className={`text-sm ${theme.textMuted}`}>{selectedAgent.title}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel — Calendar / Times / Form */}
            <div className="flex-1 p-8">
              {step === "confirmed" && bookingResult ? (
                <BookingConfirmation
                  guestName={bookingResult.guestName}
                  agentName={selectedAgent.name}
                  date={selectedDate!}
                  startTime={selectedSlot!.start}
                  endTime={selectedSlot!.end}
                  duration={bookingLink.duration}
                  meetLink={bookingResult.meetLink}
                  theme={theme}
                />
              ) : step === "form" && selectedSlot ? (
                <div className="slide-in">
                  <button
                    onClick={handleBack}
                    className={`flex items-center gap-1 text-sm ${theme.textMuted} hover:opacity-80 mb-6`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Indietro
                  </button>

                  <div className={`mb-6 p-4 rounded-xl`} style={{ backgroundColor: "var(--accent-light)" }}>
                    <p className={`font-semibold ${theme.text}`}>
                      {format(selectedDate!, "EEEE d MMMM yyyy", { locale: it })}
                    </p>
                    <p style={{ color: "var(--accent)" }} className="font-medium">
                      {format(new Date(selectedSlot.start), "HH:mm")} —{" "}
                      {format(new Date(selectedSlot.end), "HH:mm")}
                    </p>
                  </div>

                  <BookingForm
                    bookingLinkId={bookingLink.id}
                    agentId={selectedAgent.id}
                    startTime={selectedSlot.start}
                    endTime={selectedSlot.end}
                    onComplete={handleBookingComplete}
                    brandColor={brandColor}
                  />
                </div>
              ) : step === "time" && selectedDate ? (
                <div className="slide-in">
                  <button
                    onClick={handleBack}
                    className={`flex items-center gap-1 text-sm ${theme.textMuted} hover:opacity-80 mb-6`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Indietro
                  </button>

                  <h2 className={`text-lg font-semibold ${theme.text} mb-1`}>
                    {format(selectedDate, "EEEE d MMMM", { locale: it })}
                  </h2>
                  <p className={`text-sm ${theme.textMuted} mb-6`}>
                    Seleziona un orario disponibile
                  </p>

                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin" style={{ color: brandColor }} />
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <p className={`text-center py-12 ${theme.textMuted}`}>
                      Nessun orario disponibile per questa data.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.start}
                          onClick={() => handleSlotClick(slot)}
                          className="time-slot"
                        >
                          {format(new Date(slot.start), "HH:mm")}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Calendar View */
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-lg font-semibold ${theme.text}`}>
                      Seleziona una data
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className={`p-2 rounded-lg hover:bg-slate-100 ${theme.textMuted}`}
                        disabled={isBefore(endOfMonth(subMonths(currentMonth, 1)), startOfDay(new Date()))}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className={`font-medium min-w-[160px] text-center ${theme.text}`}>
                        {format(currentMonth, "MMMM yyyy", { locale: it })}
                      </span>
                      <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className={`p-2 rounded-lg hover:bg-slate-100 ${theme.textMuted}`}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-6 h-6 animate-spin" style={{ color: brandColor }} />
                    </div>
                  ) : (
                    <div>
                      {/* Day headers */}
                      <div className="cal-grid mb-2">
                        {dayHeaders.map((d) => (
                          <div
                            key={d}
                            className={`text-center text-xs font-semibold ${theme.textMuted} py-2`}
                          >
                            {d}
                          </div>
                        ))}
                      </div>

                      {/* Calendar grid */}
                      <div className="cal-grid">
                        {/* Empty cells for offset */}
                        {Array.from({ length: startOffset }).map((_, i) => (
                          <div key={`empty-${i}`} className="cal-day cal-day--empty" />
                        ))}

                        {days.map((day) => {
                          const available = isDateAvailable(day);
                          const past = isBefore(day, startOfDay(new Date()));
                          const selected = selectedDate && isSameDay(day, selectedDate);
                          const today = isToday(day);

                          return (
                            <button
                              key={day.toISOString()}
                              onClick={() => handleDateClick(day)}
                              disabled={!available || past}
                              className={`cal-day ${
                                selected
                                  ? "cal-day--active"
                                  : available && !past
                                  ? "cal-day--available"
                                  : "cal-day--disabled"
                              } ${today ? "ring-2 ring-offset-2" : ""}`}
                              style={
                                selected
                                  ? { backgroundColor: brandColor }
                                  : undefined
                              }
                            >
                              {format(day, "d")}
                            </button>
                          );
                        })}
                      </div>

                      <p className={`text-xs ${theme.textMuted} mt-6 text-center`}>
                        I giorni evidenziati hanno disponibilità
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className={`text-center text-xs mt-6 ${theme.textMuted}`}>
          Powered by <span className="font-semibold">ddgBooking</span> · by fotonik
        </p>
      </div>
    </div>
  );
}

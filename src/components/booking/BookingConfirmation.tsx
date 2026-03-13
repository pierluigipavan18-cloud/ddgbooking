"use client";

import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CheckCircle, Video, Calendar, Clock } from "lucide-react";

interface BookingConfirmationProps {
  guestName: string;
  agentName: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  meetLink?: string;
  theme: {
    text: string;
    textMuted: string;
  };
}

export function BookingConfirmation({
  guestName,
  agentName,
  date,
  startTime,
  endTime,
  duration,
  meetLink,
  theme,
}: BookingConfirmationProps) {
  return (
    <div className="text-center slide-in py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>

      <h2 className={`text-2xl font-bold ${theme.text} mb-2`}>
        Prenotazione confermata!
      </h2>
      <p className={`${theme.textMuted} mb-8`}>
        Ciao {guestName}, il tuo appuntamento è stato confermato.
      </p>

      <div className="bg-slate-50 rounded-xl p-6 text-left space-y-4 max-w-sm mx-auto">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-slate-400" />
          <div>
            <p className={`text-sm ${theme.textMuted}`}>Data</p>
            <p className={`font-semibold ${theme.text}`}>
              {format(date, "EEEE d MMMM yyyy", { locale: it })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-slate-400" />
          <div>
            <p className={`text-sm ${theme.textMuted}`}>Orario</p>
            <p className={`font-semibold ${theme.text}`}>
              {format(new Date(startTime), "HH:mm")} — {format(new Date(endTime), "HH:mm")}{" "}
              ({duration} min)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
            {agentName.charAt(0)}
          </div>
          <div>
            <p className={`text-sm ${theme.textMuted}`}>Con</p>
            <p className={`font-semibold ${theme.text}`}>{agentName}</p>
          </div>
        </div>

        {meetLink && (
          <div className="flex items-center gap-3">
            <Video className="w-5 h-5 text-slate-400" />
            <div>
              <p className={`text-sm ${theme.textMuted}`}>Videochiamata</p>
              <a
                href={meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--accent)] hover:underline"
              >
                Partecipa con Google Meet
              </a>
            </div>
          </div>
        )}
      </div>

      <p className={`text-sm ${theme.textMuted} mt-8`}>
        Ti abbiamo inviato un&apos;email di conferma con tutti i dettagli.
        <br />
        Riceverai un promemoria prima dell&apos;appuntamento.
      </p>
    </div>
  );
}

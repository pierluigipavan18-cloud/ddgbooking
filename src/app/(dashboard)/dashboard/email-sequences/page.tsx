"use client";

import { useState } from "react";
import { Mail, Clock, Zap, Check, Info } from "lucide-react";

// Pre-configured email sequences for Diego's use case
const defaultSequences = [
  {
    name: "Conferma prenotazione",
    trigger: "booking_created",
    description: "Email automatica inviata subito dopo la prenotazione",
    emails: [
      { delay: "Immediata", subject: "Conferma appuntamento", status: "active" },
    ],
  },
  {
    name: "Promemoria appuntamento",
    trigger: "booking_reminder",
    description: "Promemoria inviato 24h e 1h prima dell'appuntamento",
    emails: [
      { delay: "24 ore prima", subject: "Promemoria: appuntamento domani", status: "active" },
      { delay: "1 ora prima", subject: "Tra poco il tuo appuntamento!", status: "active" },
    ],
  },
  {
    name: "Follow-up post appuntamento",
    trigger: "booking_completed",
    description: "Sequenza di follow-up per convertire lead in clienti",
    emails: [
      { delay: "1 ora dopo", subject: "Grazie per il tuo tempo!", status: "active" },
      { delay: "3 giorni dopo", subject: "Hai avuto modo di riflettere?", status: "active" },
      { delay: "7 giorni dopo", subject: "La nostra offerta per te", status: "active" },
    ],
  },
];

export default function EmailSequencesPage() {
  const [sequences] = useState(defaultSequences);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sequenze Email</h1>
        <p className="text-slate-500">
          Email automatiche per accompagnare il lead verso l&apos;appuntamento e dopo
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Come funzionano le sequenze email</p>
          <p className="text-blue-700">
            Le email vengono inviate automaticamente in base agli eventi di prenotazione.
            Ogni sequenza ha un trigger (evento) e una serie di email con ritardi configurabili.
            Le email usano il template DDG Solutions con branding personalizzato.
          </p>
        </div>
      </div>

      {/* Sequences */}
      <div className="space-y-4">
        {sequences.map((seq, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{seq.name}</h3>
                  <p className="text-sm text-slate-500">{seq.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">Attiva</span>
              </div>
            </div>

            <div className="border-t border-slate-100 px-5 py-3 bg-slate-50">
              <div className="space-y-2">
                {seq.emails.map((email, j) => (
                  <div key={j} className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500 min-w-[120px]">{email.delay}</span>
                    <span className="text-slate-700 font-medium">{email.subject}</span>
                    <Check className="w-4 h-4 text-green-500 ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Template preview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Anteprima template email
        </h3>
        <div className="border border-slate-200 rounded-xl overflow-hidden max-w-md mx-auto">
          <div className="bg-[#0066FF] text-white text-center py-4">
            <p className="text-lg font-bold">ddgBooking</p>
            <p className="text-xs opacity-80">by fotonik</p>
          </div>
          <div className="p-6">
            <h4 className="text-lg font-semibold text-slate-900 mb-2">
              Ciao Mario! ✓
            </h4>
            <p className="text-slate-600 text-sm mb-4">Il tuo appuntamento è confermato.</p>
            <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-1">
              <p>📅 <strong>Data:</strong> venerdì 15 marzo 2026</p>
              <p>🕐 <strong>Ora:</strong> 15:00</p>
              <p>👤 <strong>Con:</strong> Marco Rossi</p>
              <p>💻 <strong>Link:</strong> <span className="text-[#0066FF]">meet.google.com/xxx</span></p>
            </div>
          </div>
          <div className="border-t border-slate-100 p-4 text-center">
            <p className="text-xs text-slate-400">
              DDG Solutions · Powered by ddgBooking · by fotonik
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

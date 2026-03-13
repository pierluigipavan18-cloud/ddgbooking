"use client";

import { useState } from "react";
import { Loader2, Shield } from "lucide-react";

interface BookingFormProps {
  bookingLinkId: string;
  agentId: string;
  startTime: string;
  endTime: string;
  onComplete: (result: { guestName: string; meetLink?: string }) => void;
  brandColor: string;
}

export function BookingForm({
  bookingLinkId,
  agentId,
  startTime,
  endTime,
  onComplete,
  brandColor,
}: BookingFormProps) {
  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    guestCompany: "",
    notes: "",
    privacyConsent: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.privacyConsent) {
      setError("È necessario accettare l'informativa sulla privacy per procedere.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingLinkId,
          agentId,
          startTime,
          endTime,
          ...formData,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Si è verificato un errore");
      }

      const data = await res.json();
      onComplete({
        guestName: formData.guestName,
        meetLink: data.booking.meetLink,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Si è verificato un errore");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Inserisci i tuoi dati
      </h3>

      {/* Name — with autocomplete for Google autofill */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Nome e Cognome *
        </label>
        <input
          type="text"
          name="name"
          autoComplete="name"
          required
          className="form-input"
          placeholder="es. Mario Rossi"
          value={formData.guestName}
          onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Email *
        </label>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          className="form-input"
          placeholder="es. mario.rossi@email.com"
          value={formData.guestEmail}
          onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Telefono
        </label>
        <input
          type="tel"
          name="phone"
          autoComplete="tel"
          className="form-input"
          placeholder="es. +39 333 1234567"
          value={formData.guestPhone}
          onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
        />
      </div>

      {/* Company */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Azienda
        </label>
        <input
          type="text"
          name="organization"
          autoComplete="organization"
          className="form-input"
          placeholder="es. Rossi Srl"
          value={formData.guestCompany}
          onChange={(e) => setFormData({ ...formData, guestCompany: e.target.value })}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Note aggiuntive
        </label>
        <textarea
          name="notes"
          className="form-input min-h-[80px] resize-none"
          placeholder="Descrivi brevemente il motivo dell'appuntamento..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      {/* Privacy consent */}
      <div className="bg-slate-50 rounded-xl p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.privacyConsent}
            onChange={(e) =>
              setFormData({ ...formData, privacyConsent: e.target.checked })
            }
            className="mt-1 w-5 h-5 rounded border-slate-300"
            style={{ accentColor: brandColor }}
          />
          <div className="text-sm text-slate-600 leading-relaxed">
            <div className="flex items-center gap-1.5 mb-1">
              <Shield className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-slate-700">Informativa sulla Privacy</span>
            </div>
            Acconsento al trattamento dei miei dati personali ai sensi del{" "}
            <strong>Regolamento UE 2016/679 (GDPR)</strong> e del{" "}
            <strong>D.Lgs. 196/2003</strong>. I dati forniti saranno utilizzati
            esclusivamente per la gestione dell&apos;appuntamento e per comunicazioni
            relative ai servizi di DDG Solutions. Per maggiori informazioni,
            consultare la nostra{" "}
            <a
              href="/privacy"
              target="_blank"
              className="underline font-medium"
              style={{ color: brandColor }}
            >
              informativa completa sulla privacy
            </a>
            .
          </div>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full"
        style={{ backgroundColor: brandColor }}
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Prenotazione in corso...
          </>
        ) : (
          "Conferma prenotazione"
        )}
      </button>
    </form>
  );
}

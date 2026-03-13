import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
            ddg<span className="text-[#0066FF]">Booking</span>
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Soluzioni di valore per l&apos;energia
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Benvenuto su ddgBooking
            </h2>
            <p className="text-slate-500 leading-relaxed">
              Il sistema di prenotazione appuntamenti di DDG Solutions.
              Prenota una consulenza con i nostri esperti in modo semplice e veloce.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/login"
              className="btn-primary w-full block"
            >
              Accedi alla Dashboard
            </Link>
            <p className="text-sm text-slate-400">
              Sei un consulente? Accedi per gestire i tuoi appuntamenti.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-xs text-slate-400">
          DDG Solutions · Powered by ddgBooking · by fotonik
        </p>
      </div>
    </div>
  );
}

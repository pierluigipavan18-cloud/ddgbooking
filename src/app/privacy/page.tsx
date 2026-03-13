export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            ddg<span className="text-[#0066FF]">Booking</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">by fotonik</p>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          Informativa sulla Privacy
        </h2>
        <p className="text-sm text-slate-400 mb-8">
          Ultimo aggiornamento: marzo 2026
        </p>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-600 leading-relaxed">
          <section>
            <h3 className="text-lg font-semibold text-slate-900">
              1. Titolare del trattamento
            </h3>
            <p>
              Il titolare del trattamento dei dati personali è <strong>DDG Solutions</strong>,
              con sede operativa in Veneto, Italia. Per qualsiasi comunicazione relativa
              alla privacy, è possibile contattarci tramite il sito{" "}
              <a href="https://ddg.solutions" className="text-[#0066FF] hover:underline">
                ddg.solutions
              </a>.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-900">
              2. Tipologia di dati raccolti
            </h3>
            <p>
              Raccogliamo i seguenti dati personali attraverso il sistema di prenotazione:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nome e cognome</li>
              <li>Indirizzo email</li>
              <li>Numero di telefono (opzionale)</li>
              <li>Nome dell&apos;azienda (opzionale)</li>
              <li>Note relative all&apos;appuntamento</li>
              <li>Data e ora della prenotazione</li>
              <li>Indirizzo IP e dati di navigazione</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-900">
              3. Finalità del trattamento
            </h3>
            <p>I dati personali vengono trattati per le seguenti finalità:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Gestione e conferma degli appuntamenti prenotati</li>
              <li>Invio di comunicazioni relative all&apos;appuntamento (conferme, promemoria)</li>
              <li>Gestione del rapporto commerciale pre e post vendita</li>
              <li>Miglioramento dei nostri servizi</li>
              <li>Adempimento di obblighi di legge</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-900">
              4. Base giuridica del trattamento
            </h3>
            <p>
              Il trattamento dei dati è basato sul <strong>consenso dell&apos;interessato</strong>{" "}
              (art. 6, par. 1, lett. a del GDPR) espresso al momento della prenotazione,
              nonché sull&apos;<strong>esecuzione di un contratto</strong> o di misure
              precontrattuali (art. 6, par. 1, lett. b del GDPR).
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-900">
              5. Conservazione dei dati
            </h3>
            <p>
              I dati personali saranno conservati per il tempo strettamente necessario
              al raggiungimento delle finalità per cui sono stati raccolti e comunque
              non oltre <strong>24 mesi</strong> dall&apos;ultimo contatto, salvo obblighi
              di legge che ne impongano una conservazione più lunga.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-900">
              6. Comunicazione e diffusione dei dati
            </h3>
            <p>
              I dati personali non saranno diffusi a terzi. Potranno essere comunicati a:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Consulenti di DDG Solutions per la gestione dell&apos;appuntamento</li>
              <li>Fornitori di servizi tecnici (hosting, email) necessari al funzionamento del servizio</li>
              <li>Google (per l&apos;integrazione con Google Calendar e Google Meet)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-900">
              7. Diritti dell&apos;interessato
            </h3>
            <p>
              Ai sensi degli artt. 15-22 del GDPR, l&apos;interessato ha il diritto di:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Accedere ai propri dati personali</li>
              <li>Ottenere la rettifica dei dati inesatti</li>
              <li>Ottenere la cancellazione dei dati (diritto all&apos;oblio)</li>
              <li>Limitare il trattamento</li>
              <li>Opporsi al trattamento</li>
              <li>Revocare il consenso in qualsiasi momento</li>
              <li>Proporre reclamo al Garante per la protezione dei dati personali</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-900">
              8. Cookie e tecnologie di tracciamento
            </h3>
            <p>
              Il sistema ddgBooking utilizza esclusivamente cookie tecnici necessari
              al funzionamento del servizio (sessione, autenticazione). Non vengono
              utilizzati cookie di profilazione o di terze parti per finalità pubblicitarie.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-900">
              9. Riferimenti normativi
            </h3>
            <p>
              Il trattamento dei dati è effettuato nel rispetto del{" "}
              <strong>Regolamento UE 2016/679 (GDPR)</strong> e del{" "}
              <strong>D.Lgs. 30 giugno 2003, n. 196</strong> (Codice in materia di
              protezione dei dati personali) come modificato dal D.Lgs. 10 agosto 2018, n. 101.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-400">
            DDG Solutions — Soluzioni di valore per l&apos;energia
          </p>
          <p className="text-xs text-slate-300 mt-1">
            Powered by ddgBooking · by fotonik
          </p>
        </div>
      </div>
    </div>
  );
}

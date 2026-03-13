"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Plus, ExternalLink, Trash2 } from "lucide-react";
import { themes, ThemeKey } from "@/lib/themes";

interface BookingLinkData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  duration: number;
  theme: string;
  isActive: boolean;
  bookingLinkAgents: Array<{ agent: { id: string; name: string; color: string } }>;
  _count: { bookings: number };
}

interface AgentData {
  id: string;
  name: string;
  color: string;
}

export default function SettingsPage() {
  const [links, setLinks] = useState<BookingLinkData[]>([]);
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    description: "",
    duration: 30,
    theme: "default",
    agentIds: [] as string[],
  });

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    Promise.all([
      fetch("/api/booking-links").then((r) => r.json()),
      fetch("/api/agents").then((r) => r.json()),
    ]).then(([linksData, agentsData]) => {
      setLinks(Array.isArray(linksData) ? linksData : []);
      setAgents(Array.isArray(agentsData) ? agentsData : []);
      setLoading(false);
    });
  }, []);

  const createLink = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/booking-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ slug: "", title: "", description: "", duration: 30, theme: "default", agentIds: [] });
    const res = await fetch("/api/booking-links");
    setLinks(await res.json());
  };

  const copyLink = (slug: string) => {
    const url = `${baseUrl}/book/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleAgent = (agentId: string) => {
    setForm({
      ...form,
      agentIds: form.agentIds.includes(agentId)
        ? form.agentIds.filter((id) => id !== agentId)
        : [...form.agentIds, agentId],
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Impostazioni</h1>
        <p className="text-slate-500">
          Gestisci i link di prenotazione e le impostazioni dell&apos;app
        </p>
      </div>

      {/* Booking Links */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Link di prenotazione</h2>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm py-2">
            <Plus className="w-4 h-4 mr-1.5" />
            Nuovo link
          </button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              Caricamento...
            </div>
          ) : links.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <p className="text-slate-500 mb-4">Nessun link di prenotazione configurato</p>
              <button onClick={() => setShowForm(true)} className="btn-primary">
                Crea il primo link
              </button>
            </div>
          ) : (
            links.map((link) => (
              <div key={link.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{link.title}</h3>
                    <p className="text-sm text-slate-500">{link.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${link.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {link.isActive ? "Attivo" : "Disattivo"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {link._count.bookings} prenotazioni
                    </span>
                  </div>
                </div>

                {/* Link URL */}
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-3 mb-3">
                  <code className="text-sm text-slate-700 flex-1 truncate">
                    {baseUrl}/book/{link.slug}
                  </code>
                  <button
                    onClick={() => copyLink(link.slug)}
                    className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500"
                  >
                    {copied === link.slug ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href={`/book/${link.slug}`}
                    target="_blank"
                    className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* API endpoint info */}
                <div className="text-xs text-slate-400 mb-2">
                  API per AI agents: <code className="bg-slate-100 px-1.5 py-0.5 rounded">
                    GET /api/v1/slots?slug={link.slug}
                  </code>
                </div>

                {/* Assigned agents */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Agenti:</span>
                  {link.bookingLinkAgents.map((bla) => (
                    <span
                      key={bla.agent.id}
                      className="text-xs px-2 py-1 rounded-full text-white"
                      style={{ backgroundColor: bla.agent.color }}
                    >
                      {bla.agent.name}
                    </span>
                  ))}
                </div>

                {/* Theme & Duration */}
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <span>Durata: {link.duration} min</span>
                  <span>Tema: {themes[link.theme as ThemeKey]?.name || link.theme}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* API Documentation */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Integrazione API per AI Agents
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Usa questi endpoint per integrare ddgBooking con i tuoi agenti Plusvibe o altri sistemi AI.
        </p>

        <div className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm font-mono font-medium text-slate-900 mb-2">
              GET /api/v1/slots?slug=&#123;slug&#125;&count=3
            </p>
            <p className="text-sm text-slate-600">
              Ottieni slot suggeriti con messaggi in italiano pronti per essere inviati ai lead.
              Ritorna frasi come &quot;domani verso le 15:00 come suona?&quot; con link di prenotazione diretti.
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm font-mono font-medium text-slate-900 mb-2">
              POST /api/v1/book
            </p>
            <p className="text-sm text-slate-600">
              Crea una prenotazione programmaticamente. Perfetto per far prenotare i lead
              direttamente dalla chat con l&apos;agente AI.
            </p>
          </div>
        </div>
      </div>

      {/* Create Link Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-slate-900 mb-6">
              Nuovo link di prenotazione
            </h2>
            <form onSubmit={createLink} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titolo *</label>
                <input
                  required
                  className="form-input"
                  placeholder="es. Consulenza Energia"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Slug *</label>
                <div className="flex items-center">
                  <span className="text-sm text-slate-400 mr-2">/book/</span>
                  <input
                    required
                    className="form-input"
                    placeholder="es. energia"
                    value={form.slug}
                    onChange={(e) =>
                      setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrizione</label>
                <textarea
                  className="form-input min-h-[60px]"
                  placeholder="Descrizione opzionale..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Durata (minuti)
                </label>
                <select
                  className="form-input"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                >
                  <option value={15}>15 minuti</option>
                  <option value={30}>30 minuti</option>
                  <option value={45}>45 minuti</option>
                  <option value={60}>60 minuti</option>
                </select>
              </div>

              {/* Theme selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tema</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(themes).map(([key, theme]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm({ ...form, theme: key })}
                      className={`p-3 rounded-lg text-sm font-medium border-2 transition-colors ${
                        form.theme === key
                          ? "border-[#0066FF] bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div
                        className="w-full h-4 rounded mb-2"
                        style={{ background: `linear-gradient(135deg, ${theme.css["--bg-from"]}, ${theme.css["--bg-to"]})` }}
                      />
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Agent selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Agenti assegnati
                </label>
                <div className="space-y-2">
                  {agents.map((agent) => (
                    <label
                      key={agent.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        form.agentIds.includes(agent.id)
                          ? "border-[#0066FF] bg-blue-50"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.agentIds.includes(agent.id)}
                        onChange={() => toggleAgent(agent.id)}
                        className="w-4 h-4"
                        style={{ accentColor: "#0066FF" }}
                      />
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: agent.color }}
                      >
                        {agent.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{agent.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Crea link</button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

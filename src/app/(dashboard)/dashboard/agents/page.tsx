"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, X, Copy } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  email: string;
  title: string | null;
  color: string;
  isActive: boolean;
  availability: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  _count: { bookings: number };
}

const dayNames = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const colors = ["#0066FF", "#059669", "#EA580C", "#7C3AED", "#DC2626", "#0891B2", "#CA8A04"];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    color: "#0066FF",
    availability: [1, 2, 3, 4, 5].map((d) => ({
      dayOfWeek: d,
      startTime: "09:00",
      endTime: "18:00",
    })),
  });

  const fetchAgents = async () => {
    setLoading(true);
    const res = await fetch("/api/agents");
    const data = await res.json();
    setAgents(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      await fetch("/api/agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...form }),
      });
    } else {
      await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    setShowForm(false);
    setEditingId(null);
    setForm({
      name: "",
      email: "",
      title: "",
      color: "#0066FF",
      availability: [1, 2, 3, 4, 5].map((d) => ({
        dayOfWeek: d,
        startTime: "09:00",
        endTime: "18:00",
      })),
    });
    fetchAgents();
  };

  const editAgent = (agent: Agent) => {
    setForm({
      name: agent.name,
      email: agent.email,
      title: agent.title || "",
      color: agent.color,
      availability: agent.availability.length > 0
        ? agent.availability
        : [1, 2, 3, 4, 5].map((d) => ({ dayOfWeek: d, startTime: "09:00", endTime: "18:00" })),
    });
    setEditingId(agent.id);
    setShowForm(true);
  };

  const toggleActive = async (agent: Agent) => {
    await fetch("/api/agents", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: agent.id, isActive: !agent.isActive }),
    });
    fetchAgents();
  };

  const toggleDay = (dayOfWeek: number) => {
    const exists = form.availability.find((a) => a.dayOfWeek === dayOfWeek);
    if (exists) {
      setForm({
        ...form,
        availability: form.availability.filter((a) => a.dayOfWeek !== dayOfWeek),
      });
    } else {
      setForm({
        ...form,
        availability: [
          ...form.availability,
          { dayOfWeek, startTime: "09:00", endTime: "18:00" },
        ].sort((a, b) => a.dayOfWeek - b.dayOfWeek),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenti</h1>
          <p className="text-slate-500">Gestisci i consulenti e la loro disponibilità</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); }} className="btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          Nuovo agente
        </button>
      </div>

      {/* Agent List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            Caricamento...
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500 mb-4">Nessun agente configurato</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Crea il primo agente
            </button>
          </div>
        ) : (
          agents.map((agent) => (
            <div
              key={agent.id}
              className={`bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 ${!agent.isActive ? "opacity-60" : ""}`}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0"
                style={{ backgroundColor: agent.color }}
              >
                {agent.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{agent.name}</h3>
                  {!agent.isActive && (
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      Disattivo
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">{agent.email}</p>
                {agent.title && <p className="text-sm text-slate-400">{agent.title}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{agent._count.bookings}</p>
                <p className="text-xs text-slate-400">prenotazioni</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => editAgent(agent)}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleActive(agent)}
                  className={`p-2 rounded-lg hover:bg-slate-100 ${agent.isActive ? "text-green-500" : "text-slate-400"}`}
                >
                  {agent.isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Agent Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-slate-900 mb-6">
              {editingId ? "Modifica agente" : "Nuovo agente"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                <input
                  required
                  className="form-input"
                  placeholder="es. Marco Rossi"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ruolo</label>
                <input
                  className="form-input"
                  placeholder="es. Consulente Energia"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Colore</label>
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-full ${form.color === c ? "ring-2 ring-offset-2 ring-slate-400" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Disponibilità settimanale
                </label>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                    const avail = form.availability.find((a) => a.dayOfWeek === day);
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`w-12 text-sm font-medium py-1.5 rounded-lg transition-colors ${
                            avail
                              ? "bg-[#0066FF] text-white"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {dayNames[day]}
                        </button>
                        {avail && (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              className="form-input text-sm py-1.5 w-auto"
                              value={avail.startTime}
                              onChange={(e) => {
                                const updated = form.availability.map((a) =>
                                  a.dayOfWeek === day ? { ...a, startTime: e.target.value } : a
                                );
                                setForm({ ...form, availability: updated });
                              }}
                            />
                            <span className="text-slate-400">—</span>
                            <input
                              type="time"
                              className="form-input text-sm py-1.5 w-auto"
                              value={avail.endTime}
                              onChange={(e) => {
                                const updated = form.availability.map((a) =>
                                  a.dayOfWeek === day ? { ...a, endTime: e.target.value } : a
                                );
                                setForm({ ...form, availability: updated });
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  {editingId ? "Salva modifiche" : "Crea agente"}
                </button>
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

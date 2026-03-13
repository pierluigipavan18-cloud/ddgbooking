"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Filter, ChevronDown, Phone, Mail, Building, Tag, Clock, MessageSquare, X } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  stage: string;
  source: string | null;
  notes: string | null;
  tags: string | null;
  privacyConsent: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { bookings: number };
  activities: Array<{
    id: string;
    type: string;
    content: string;
    createdAt: string;
  }>;
  bookings: Array<{
    id: string;
    startTime: string;
    status: string;
    guestName: string;
  }>;
}

const stages = [
  { value: "lead", label: "Lead", color: "bg-yellow-100 text-yellow-700" },
  { value: "prospect", label: "Prospect", color: "bg-blue-100 text-blue-700" },
  { value: "customer", label: "Cliente", color: "bg-green-100 text-green-700" },
  { value: "churned", label: "Perso", color: "bg-red-100 text-red-700" },
];

export default function CRMPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [showNewContact, setShowNewContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    stage: "lead",
    notes: "",
  });

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (stageFilter) params.set("stage", stageFilter);

    const res = await fetch(`/api/contacts?${params}`);
    const data = await res.json();
    setContacts(data.contacts || []);
    setLoading(false);
  }, [search, stageFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchContacts, 300);
    return () => clearTimeout(timer);
  }, [fetchContacts]);

  const updateContactStage = async (contactId: string, stage: string) => {
    await fetch("/api/contacts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: contactId, stage }),
    });
    fetchContacts();
    if (selectedContact?.id === contactId) {
      setSelectedContact({ ...selectedContact, stage });
    }
  };

  const addNote = async () => {
    if (!selectedContact || !newNote.trim()) return;
    await fetch("/api/contacts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedContact.id,
        notes: selectedContact.notes
          ? `${selectedContact.notes}\n\n[${format(new Date(), "dd/MM/yyyy HH:mm")}] ${newNote}`
          : `[${format(new Date(), "dd/MM/yyyy HH:mm")}] ${newNote}`,
      }),
    });
    setNewNote("");
    setShowAddNote(false);
    fetchContacts();
  };

  const createContact = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newContact),
    });
    setShowNewContact(false);
    setNewContact({ name: "", email: "", phone: "", company: "", stage: "lead", notes: "" });
    fetchContacts();
  };

  const getStageInfo = (stage: string) =>
    stages.find((s) => s.value === stage) || stages[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CRM Contatti</h1>
          <p className="text-slate-500">Gestisci i tuoi contatti pre e post vendita</p>
        </div>
        <button
          onClick={() => setShowNewContact(true)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuovo contatto
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca per nome, email, azienda..."
            className="form-input pl-12"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {stages.map((stage) => (
            <button
              key={stage.value}
              onClick={() =>
                setStageFilter(stageFilter === stage.value ? "" : stage.value)
              }
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                stageFilter === stage.value
                  ? stage.color
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {stage.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contact list + Detail panel */}
      <div className="flex gap-6">
        {/* List */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Caricamento...</div>
          ) : contacts.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nessun contatto trovato</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {contacts.map((contact) => {
                const stageInfo = getStageInfo(contact.stage);
                return (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 transition-colors ${
                      selectedContact?.id === contact.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 truncate">
                          {contact.name}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stageInfo.color}`}>
                          {stageInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 truncate">{contact.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">
                        {contact._count.bookings} prenotazioni
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedContact && (
          <div className="hidden lg:block w-96 bg-white rounded-xl border border-slate-200 p-6 space-y-6 h-fit sticky top-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {selectedContact.name}
              </h3>
              <button
                onClick={() => setSelectedContact(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-slate-400" />
                <a href={`mailto:${selectedContact.email}`} className="text-[#0066FF] hover:underline">
                  {selectedContact.email}
                </a>
              </div>
              {selectedContact.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <a href={`tel:${selectedContact.phone}`} className="text-slate-700">
                    {selectedContact.phone}
                  </a>
                </div>
              )}
              {selectedContact.company && (
                <div className="flex items-center gap-3 text-sm">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{selectedContact.company}</span>
                </div>
              )}
            </div>

            {/* Stage selector */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Stato</p>
              <div className="flex gap-2 flex-wrap">
                {stages.map((stage) => (
                  <button
                    key={stage.value}
                    onClick={() => updateContactStage(selectedContact.id, stage.value)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      selectedContact.stage === stage.value
                        ? stage.color
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {stage.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">Note</p>
                <button
                  onClick={() => setShowAddNote(!showAddNote)}
                  className="text-xs text-[#0066FF] hover:underline"
                >
                  + Aggiungi nota
                </button>
              </div>
              {showAddNote && (
                <div className="space-y-2 mb-3">
                  <textarea
                    className="form-input text-sm min-h-[60px]"
                    placeholder="Scrivi una nota..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button onClick={addNote} className="btn-primary text-sm py-2 px-4">
                      Salva
                    </button>
                    <button
                      onClick={() => { setShowAddNote(false); setNewNote(""); }}
                      className="text-sm text-slate-500 hover:text-slate-700"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              )}
              {selectedContact.notes ? (
                <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {selectedContact.notes}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Nessuna nota</p>
              )}
            </div>

            {/* Recent Activity */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Attività recente</p>
              {selectedContact.activities.length === 0 ? (
                <p className="text-sm text-slate-400">Nessuna attività</p>
              ) : (
                <div className="space-y-2">
                  {selectedContact.activities.map((act) => (
                    <div key={act.id} className="flex gap-3 text-sm">
                      <Clock className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-slate-600">{act.content}</p>
                        <p className="text-xs text-slate-400">
                          {format(new Date(act.createdAt), "dd/MM/yyyy HH:mm", { locale: it })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Privacy */}
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${selectedContact.privacyConsent ? "bg-green-400" : "bg-red-400"}`} />
              {selectedContact.privacyConsent ? "Consenso privacy accordato" : "Consenso privacy non accordato"}
            </div>
          </div>
        )}
      </div>

      {/* New Contact Modal */}
      {showNewContact && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setShowNewContact(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Nuovo contatto</h2>
            <form onSubmit={createContact} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                <input
                  required
                  className="form-input"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefono</label>
                <input
                  className="form-input"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Azienda</label>
                <input
                  className="form-input"
                  value={newContact.company}
                  onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
                <textarea
                  className="form-input min-h-[60px]"
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Crea contatto</button>
                <button
                  type="button"
                  onClick={() => setShowNewContact(false)}
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

function Users(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

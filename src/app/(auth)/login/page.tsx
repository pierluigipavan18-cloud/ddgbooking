"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: "/dashboard",
      });
    } catch {
      setError("Email o password non validi");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            ddg<span className="text-[#0066FF]">Booking</span>
          </h1>
          <p className="text-slate-500 mt-1">Accedi alla tua dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 p-8">
          <form onSubmit={handleCredentials} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                className="form-input"
                placeholder="La tua email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                required
                className="form-input"
                placeholder="La tua password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Accesso in corso..." : "Accedi"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          DDG Solutions · Powered by ddgBooking · by fotonik
        </p>
      </div>
    </div>
  );
}

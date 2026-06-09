"use client";

import { useState } from "react";
import { Radar } from "lucide-react";
import { useAuth } from "@/lib/auth";

const DEMO = [
  { email: "admin@undp.org", role: "Crisis Bureau admin" },
  { email: "regional@undp.org", role: "Regional Bureau" },
  { email: "co@undp.org", role: "Country Office analyst" },
  { email: "validator@undp.org", role: "Field validator" },
  { email: "viewer@undp.org", role: "External viewer (read-only)" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("co@undp.org");
  const [password, setPassword] = useState("beacon123");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
    } catch {
      setError("Invalid email or password");
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-white shadow-sm shadow-primary/30">
            <Radar size={24} strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <div className="text-[19px] font-bold tracking-tight text-ink">Beacon</div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-ink3">Analyst Console</div>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <h1 className="text-[18px] font-bold text-ink">Sign in</h1>
          <p className="mt-0.5 text-[13px] text-ink3">UNDP analyst access</p>

          <label className="mt-5 block text-[12px] font-semibold uppercase tracking-wide text-ink3">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[14px] text-ink outline-none focus:border-primary"
          />
          <label className="mt-4 block text-[12px] font-semibold uppercase tracking-wide text-ink3">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[14px] text-ink outline-none focus:border-primary"
          />
          {error && <p className="mt-3 text-[13px] font-medium text-complete">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full rounded-xl bg-primary py-2.5 text-[14px] font-semibold text-white hover:bg-primary-ink disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-4 rounded-2xl border border-line bg-surface2/50 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Demo accounts · password beacon123</div>
          <div className="mt-2 flex flex-col gap-1.5">
            {DEMO.map((d) => (
              <button
                key={d.email}
                onClick={() => { setEmail(d.email); setPassword("beacon123"); }}
                className="flex items-center justify-between rounded-lg px-2 py-1 text-left text-[12px] hover:bg-surface"
              >
                <span className="font-mono text-ink2">{d.email}</span>
                <span className="text-ink3">{d.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

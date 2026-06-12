"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/lib/auth";

// Decides the chrome: the public landing (/), /login and the login-free /public
// community view are standalone; every other route gets the analyst shell
// behind the auth guard.
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (pathname === "/" || pathname === "/classic" || pathname === "/login" || pathname === "/public") return <>{children}</>;

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-ink3">Loading…</div>;
  }
  if (!user) {
    // AuthProvider is redirecting to /login.
    return <div className="grid min-h-screen place-items-center text-ink3">Redirecting…</div>;
  }
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

import type { Metadata } from "next";

// The login-free community page gets its own title; every other route inherits
// the root "Analyst Console" metadata.
export const metadata: Metadata = {
  title: "Beacon · Community view",
  description:
    "Aggregated crisis-damage hotspots from verified community reports — privacy-preserving public view.",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return children;
}

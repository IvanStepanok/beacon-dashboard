import type { Metadata } from "next";
import CinematicLanding from "@/components/landing/cinematic/CinematicLanding";

export const metadata: Metadata = {
  title: "Beacon — from 700 km up, every street looks fine",
  description:
    "Scroll from orbit to street level: how Beacon turns any phone into an offline-first damage sensor and feeds verified crisis data to UNDP analysts within hours.",
};

export default function LandingPage() {
  return <CinematicLanding />;
}

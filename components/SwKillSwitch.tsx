"use client";

/* Companion to public/sw.js: even when an old service worker lets the page
   itself through (network-first strategies), its registration and caches
   linger. Unregister everything on this origin and wipe Cache Storage once
   per session; if a worker was actively controlling this page, reload so
   the tab leaves its grasp. */

import { useEffect } from "react";

export function SwKillSwitch() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const FLAG = "sw-killed";
    (async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length === 0) return;
        const wasControlled = !!navigator.serviceWorker.controller;
        await Promise.all(registrations.map((r) => r.unregister()));
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
        if (wasControlled && !sessionStorage.getItem(FLAG)) {
          sessionStorage.setItem(FLAG, "1");
          location.reload();
        }
      } catch {
        /* never let cleanup break the page */
      }
    })();
  }, []);
  return null;
}

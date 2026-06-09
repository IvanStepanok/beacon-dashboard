"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/api";

/**
 * Loads a report photo through an authenticated fetch (Bearer JWT) and renders it
 * from an object URL. A plain <img src> sends NO Authorization header, so the photo
 * endpoint treats it as anonymous and 404s any UN-verified report's photo (the
 * privacy gate: public callers only ever see verified photos). An authenticated
 * analyst is allowed every status — but only if the token rides along, which a bare
 * <img> can't do. This component carries it.
 */
export function AuthImage({
  src,
  alt = "",
  className = "",
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  // Initial state IS the loading state. Callers remount this component on src
  // change via key={src}, so url/failed re-initialise to the fresh loading
  // state automatically — no synchronous reset inside the effect (which would
  // trip react-hooks/set-state-in-effect).
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const token = getToken();
    fetch(src, {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`photo ${r.status}`);
        return r.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (failed) {
    return <div className={`${className} grid place-items-center bg-surface2 text-[12px] text-ink3`}>Photo unavailable</div>;
  }
  if (!url) {
    return <div className={`${className} animate-pulse bg-surface2`} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} />;
}

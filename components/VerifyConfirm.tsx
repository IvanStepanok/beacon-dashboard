"use client";

import { AlertTriangle } from "lucide-react";

/**
 * Inline confirm shown when the backend refuses "verified" on a photo-less
 * report (409 photo_required). Retrying needs an explicit force=true AND a
 * note — the note lands in the verification audit trail, so the input here is
 * mandatory before "Verify anyway" unlocks.
 */
export function VerifyConfirm({
  note,
  onNote,
  onConfirm,
  onCancel,
  busy,
}: {
  note: string;
  onNote: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  return (
    <div className="rounded-xl border border-warn/40 bg-warn-soft/60 p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle size={15} className="mt-0.5 shrink-0 text-warn" />
        <span className="text-[13px] font-semibold text-ink">No photo on this report — verify anyway?</span>
      </div>
      <input
        value={note}
        onChange={(e) => onNote(e.target.value)}
        placeholder="Required: why is this verifiable without a photo?"
        className="mt-2 w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] outline-none placeholder:text-ink3 focus:border-primary"
      />
      <div className="mt-2 flex gap-2">
        <button
          disabled={busy || !note.trim()}
          onClick={onConfirm}
          className="flex-1 rounded-lg bg-warn px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          Verify anyway
        </button>
        <button
          disabled={busy}
          onClick={onCancel}
          className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-semibold text-ink2 hover:bg-surface2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

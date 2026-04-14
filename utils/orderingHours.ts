// ─── Ordering hours (Los Angeles time) ───────────────────────────────────────
// Status is driven by store_settings in the database.
// Falls back to defaults (11:30 AM – 8:00 PM) when settings are not yet loaded.

import type { StoreSettings } from "@/services/supabaseService";

function getLAMinutes(): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).formatToParts(new Date());
    const hour   = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
    return (hour % 24) * 60 + minute;
  } catch {
    // Fallback to device local time if Intl timezone support is unavailable
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }
}

function formatPT(h: number, m: number): string {
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period} (PT)`;
}

export interface OrderingStatus {
  isOpen: boolean;
  message: string;
}

export function getOrderingStatusFromSettings(settings: StoreSettings | null): OrderingStatus {
  if (settings?.manually_closed) {
    return { isOpen: false, message: "We're currently closed." };
  }
  if (settings?.always_open) {
    return { isOpen: true, message: "" };
  }

  // Scheduled — use DB times or defaults
  const openTime  = settings?.ordering_open_time  ?? "11:30";
  const closeTime = settings?.ordering_close_time ?? "20:00";
  const [openH,  openM]  = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);
  const openMinutes  = openH  * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  const mins = getLAMinutes();
  if (mins >= openMinutes && mins < closeMinutes) {
    return { isOpen: true, message: "" };
  }
  if (mins < openMinutes) {
    return { isOpen: false, message: `Ordering opens at ${formatPT(openH, openM)}` };
  }
  return { isOpen: false, message: `Ordering closed — reopens at ${formatPT(openH, openM)}` };
}

/** Backward-compatible wrapper used by cart and item-detail until they are refactored. */
export function getOrderingStatus(): OrderingStatus {
  return getOrderingStatusFromSettings(null);
}

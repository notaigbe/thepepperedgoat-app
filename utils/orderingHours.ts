// ─── Ordering hours (Los Angeles time) ───────────────────────────────────────
// Kitchen open: 12:00 PM – 8:00 PM daily.
// Ordering opens 30 minutes early at 11:30 AM.

const ORDERING_OPEN_MINUTES  = 11 * 60 + 30; // 11:30 AM
const ORDERING_CLOSE_MINUTES = 20 * 60;       // 8:00 PM

function getLAMinutes(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  const hour   = parseInt(parts.find((p) => p.type === "hour")!.value, 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")!.value, 10);
  return hour * 60 + minute;
}

export interface OrderingStatus {
  isOpen: boolean;
  message: string;
}

export function getOrderingStatus(): OrderingStatus {
  const mins = getLAMinutes();
  if (mins >= ORDERING_OPEN_MINUTES && mins < ORDERING_CLOSE_MINUTES) {
    return { isOpen: true, message: "" };
  }
  if (mins < ORDERING_OPEN_MINUTES) {
    return { isOpen: false, message: "Ordering opens at 11:30 AM (PT)" };
  }
  return { isOpen: false, message: "Ordering closed — reopens at 11:30 AM (PT)" };
}

/**
 * Convert a recorded implementation instant into a factory-local YYYY-MM month.
 * Unknown or invalid timestamps stay unknown; they are never replaced with today.
 */
export function implementedMonthFromTimestamp(
  timestamp: string | null | undefined,
  timeZone: string,
): string {
  if (!timestamp) return "";
  const instant = new Date(timestamp);
  if (Number.isNaN(instant.getTime())) return "";

  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
    }).formatToParts(instant);
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    return year && month ? `${year}-${month}` : "";
  } catch {
    // An invalid/missing factory timezone must not create a guessed date.
    return "";
  }
}

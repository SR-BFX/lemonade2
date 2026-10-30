export function formatWhen(date: Date, now = new Date()): string {
  const sameDay = date.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
  if (sameDay) return `${time} today`;
  const yesterday = new Date(now);
  yesterday.setUTCDate(now.getUTCDate() - 1);
  if (date.toISOString().slice(0, 10) === yesterday.toISOString().slice(0, 10)) return `${time} yesterday`;
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" });
}

export function formatDay(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

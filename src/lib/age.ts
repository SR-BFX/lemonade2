export const MIN_AGE = 13;
export const MAX_AGE = 19;
export const ROMANTIC_AGE = 16;

export function ageFromDob(dob: string, now = new Date()): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!match) return -1;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  let age = now.getUTCFullYear() - year;
  const nowMonth = now.getUTCMonth() + 1;
  const nowDay = now.getUTCDate();
  if (nowMonth < month || (nowMonth === month && nowDay < day)) age -= 1;
  return age;
}

export function isUnder16(dob: string, now = new Date()): boolean {
  return ageFromDob(dob, now) < ROMANTIC_AGE;
}

export function canUseRomanticFeatures(dob: string, now = new Date()): boolean {
  return ageFromDob(dob, now) >= ROMANTIC_AGE;
}

export function validateDob(dob: string, now = new Date()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return "Enter your date of birth.";
  const age = ageFromDob(dob, now);
  if (age < MIN_AGE) return `Lemonade is for high school students ${MIN_AGE} and older.`;
  if (age > MAX_AGE) return "Lemonade is for current high school students.";
  return null;
}

export function dayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function yesterdayKey(now = new Date()): string {
  const copy = new Date(now);
  copy.setUTCDate(copy.getUTCDate() - 1);
  return copy.toISOString().slice(0, 10);
}

const WORDS = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "slut",
  "whore",
  "dick",
  "cunt",
  "nigger",
  "faggot",
  "retard",
];

const PHRASES = ["kill yourself", "kys", "go die"];

export function hasProfanity(input: string): boolean {
  const lowered = input.toLowerCase();
  if (PHRASES.some((phrase) => lowered.includes(phrase))) return true;
  const tokens = lowered
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  return WORDS.some((word) => tokens.includes(word));
}

export function messageProblem(input: string, max = 200): string | null {
  const trimmed = input.trim();
  if (trimmed.length > max) return `Keep it under ${max} characters.`;
  if (trimmed && hasProfanity(trimmed)) return "That message isn't allowed. Keep it kind.";
  return null;
}

const STAFF_LANGUAGE =
  /\b(teacher|teachers|professor|principal|faculty|mr\.|mrs\.|ms\.|miss)\b/i;

export function mentionsStaff(input: string): boolean {
  return STAFF_LANGUAGE.test(input);
}

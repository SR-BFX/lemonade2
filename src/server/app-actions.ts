"use server";

import { redirect } from "next/navigation";
import { applyAmbassador } from "@/lib/ambassador";
import { deleteAccount } from "@/lib/account";
import { runAutopilot } from "@/lib/autopilot";
import { respondToEvent } from "@/lib/autopilot";
import { buyBoost, purchaseSku } from "@/lib/economy";
import { sendGift } from "@/lib/gifts";
import { blockUser, fileReport, resolveReport, unblockUser } from "@/lib/moderation";
import { commentOnPoll, createPoll, voteOnPoll } from "@/lib/polls";
import { saveCircle, saveProfile, updateSettings } from "@/lib/profile";
import { getPrisma } from "@/lib/prisma";
import { resendParentalConsent } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { clearSessionCookie, getCurrentUser } from "@/server/session";

function go(path: string, error?: string): never {
  redirect(error ? `${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(error)}` : path);
}

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return user;
}

export async function submitProfile(formData: FormData) {
  const user = await requireUser();
  const result = await saveProfile({
    userId: user.id,
    displayName: String(formData.get("displayName") || ""),
    handle: String(formData.get("handle") || ""),
    grade: Number(formData.get("grade") || 0),
    avatarEmoji: String(formData.get("avatarEmoji") || "🍋"),
    bio: String(formData.get("bio") || ""),
    traits: String(formData.get("traits") || ""),
    clubs: String(formData.get("clubs") || ""),
    directoryOptIn: formData.get("directoryOptIn") === "on",
    autopilotOptIn: formData.get("autopilotOptIn") === "on",
    memoryOptIn: formData.get("memoryOptIn") === "on",
  });
  if (!result.ok) go("/onboarding/profile", result.error);
  go("/onboarding/people");
}

export async function submitCircle(formData: FormData) {
  const user = await requireUser();
  const finish = formData.get("finish") === "1";
  const result = await saveCircle({
    userId: user.id,
    friendIds: formData.getAll("friendIds").map(String),
    crushIds: formData.getAll("crushIds").map(String),
    finishOnboarding: finish,
  });
  const back = finish ? "/onboarding/people" : "/friends";
  if (!result.ok) go(back, result.error);
  go(finish ? "/home" : "/friends?notice=Saved");
}

export async function submitSettings(formData: FormData) {
  const user = await requireUser();
  const capRaw = String(formData.get("dailySpendCap") || "");
  const unlimited = formData.get("unlimitedCap") === "on";
  const result = await updateSettings({
    userId: user.id,
    directoryOptIn: formData.get("directoryOptIn") === "on",
    allowAnonymous: formData.get("allowAnonymous") === "on",
    autopilotOptIn: formData.get("autopilotOptIn") === "on",
    memoryOptIn: formData.get("memoryOptIn") === "on",
    sleepStartHour: Number(formData.get("sleepStartHour") || 22),
    sleepEndHour: Number(formData.get("sleepEndHour") || 7),
    dailySpendCap: unlimited ? null : Number(capRaw || 0),
  });
  if (!result.ok) go("/settings", result.error);
  go("/settings?notice=Saved");
}

export async function resendConsent() {
  const user = await requireUser();
  const result = await resendParentalConsent(user.id);
  if (!result.ok) go("/settings", result.error);
  go("/settings?notice=Approval%20email%20sent");
}

export async function chooseAction(formData: FormData) {
  const user = await requireUser();
  const eventId = String(formData.get("eventId") || "");
  const result = await respondToEvent({
    userId: user.id,
    eventId,
    choiceKey: String(formData.get("choiceKey") || ""),
  });
  if (!result.ok) go(`/events/${eventId}`, result.error);
  go(`/events/${eventId}?notice=Choice%20saved`);
}

export async function submitGift(formData: FormData) {
  const user = await requireUser();
  const giftKey = String(formData.get("giftKey") || "");
  const result = await sendGift({
    fromId: user.id,
    toId: String(formData.get("toId") || ""),
    giftKey,
    anonymous: formData.get("mode") === "anonymous",
    message: String(formData.get("message") || ""),
  });
  if (!result.ok) go(`/gifts/${giftKey}`, result.error);
  go("/gifts?notice=Gift%20sent");
}

export async function submitPoll(formData: FormData) {
  const user = await requireUser();
  const kind = String(formData.get("optionKind") || "text");
  const options = kind === "members"
    ? formData.getAll("memberIds").map((id) => ({ type: "member" as const, userId: String(id) }))
    : String(formData.get("textOptions") || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((label) => ({ type: "text" as const, label }));
  const result = await createPoll({
    authorId: user.id,
    question: String(formData.get("question") || ""),
    category: String(formData.get("category") || "fun"),
    options,
  });
  if (!result.ok) go("/polls/new", result.error);
  go(`/polls/${result.data.pollId}`);
}

export async function submitVote(formData: FormData) {
  const user = await requireUser();
  const pollId = String(formData.get("pollId") || "");
  const result = await voteOnPoll(user.id, String(formData.get("optionId") || ""));
  if (!result.ok) go(`/polls/${pollId}`, result.error);
  go(`/polls/${pollId}?notice=Vote%20counted`);
}

export async function submitComment(formData: FormData) {
  const user = await requireUser();
  const pollId = String(formData.get("pollId") || "");
  const result = await commentOnPoll(user.id, pollId, String(formData.get("body") || ""));
  if (!result.ok) go(`/polls/${pollId}`, result.error);
  go(`/polls/${pollId}#comments`);
}

export async function submitBoost(formData: FormData) {
  const user = await requireUser();
  const result = await buyBoost(user.id, String(formData.get("tier") || ""));
  if (!result.ok) go("/boost", result.error);
  go("/profile?notice=Boost%20is%20on");
}

export async function submitPurchase(formData: FormData) {
  const user = await requireUser();
  const result = await purchaseSku(user.id, String(formData.get("sku") || ""));
  if (!result.ok) go("/store", result.error);
  go(`/store?notice=Test%20checkout%20${encodeURIComponent(result.data.ref)}%20%E2%80%94%20nothing%20was%20charged`);
}

export async function submitAmbassador(formData: FormData) {
  const user = await requireUser();
  const result = await applyAmbassador({
    userId: user.id,
    grade: Number(formData.get("grade") || user.grade || 0),
    pitch: String(formData.get("pitch") || ""),
  });
  if (!result.ok) go("/ambassador", result.error);
  go("/ambassador?notice=Application%20sent.%20We'll%20review%20it%20in%20a%20few%20days.");
}

export async function submitBlock(formData: FormData) {
  const user = await requireUser();
  const handle = String(formData.get("handle") || "");
  const result = await blockUser(user.id, String(formData.get("userId") || ""));
  if (!result.ok) go(`/u/${handle}`, result.error);
  go(`/u/${handle}?notice=Blocked`);
}

export async function submitUnblock(formData: FormData) {
  const user = await requireUser();
  await unblockUser(user.id, String(formData.get("userId") || ""));
  go("/settings?notice=Unblocked");
}

export async function submitReport(formData: FormData) {
  const user = await requireUser();
  const back = String(formData.get("back") || "/home");
  const result = await fileReport({
    reporterId: user.id,
    targetType: String(formData.get("targetType") || ""),
    targetId: String(formData.get("targetId") || ""),
    reason: String(formData.get("reason") || ""),
  });
  if (!result.ok) go(back, result.error);
  go(`${back}${back.includes("?") ? "&" : "?"}notice=Report%20sent`);
}

export async function moderate(formData: FormData) {
  const user = await requireUser();
  const result = await resolveReport({
    moderatorId: user.id,
    reportId: String(formData.get("reportId") || ""),
    action: String(formData.get("action") || "dismiss") as "dismiss" | "remove" | "suspend",
  });
  if (!result.ok) go("/mod", result.error);
  go("/mod?notice=Updated");
}

export async function deleteMemory(formData: FormData) {
  const user = await requireUser();
  const prisma = getPrisma();
  const id = String(formData.get("id") || "");
  if (id === "all") await prisma.avatarMemory.deleteMany({ where: { userId: user.id } });
  else await prisma.avatarMemory.deleteMany({ where: { id, userId: user.id } });
  go("/memory?notice=Deleted");
}

export async function deleteMe(formData: FormData) {
  const user = await requireUser();
  if (String(formData.get("confirm") || "") !== "DELETE") go("/settings", "Type DELETE to confirm.");
  const result = await deleteAccount(user.id);
  if (!result.ok) go("/settings", result.error);
  await clearSessionCookie();
  redirect("/?notice=Account%20deleted");
}

export async function triggerAutopilot() {
  if (process.env.NODE_ENV === "production") go("/settings", "Manual autopilot is a dev tool.");
  const user = await requireUser();
  const result = await runAutopilot({ force: true, onlyUserId: user.id });
  go(`/home?notice=${encodeURIComponent(`Autopilot added ${result.created} event(s) via ${result.provider}.`)}`);
}

export async function submitSupport(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const body = String(formData.get("body") || "").trim();
  if (!email.includes("@") || body.length < 4) go("/support", "Add your email and a short note.");
  const prisma = getPrisma();
  await prisma.supportMessage.create({ data: { email, body } });
  await sendEmail(email, "Lemonade support received", "We got your note. This demo stores it locally and does not page a human.");
  go("/support?notice=Sent.%20In%20dev%2C%20check%20%2Fdev%2Fmail.");
}

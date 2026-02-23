import { supabase } from "./supabase";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `Request failed: ${res.status}`);
  return json as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BibleBook { name: string; chapters: number }
export interface BibleVerse { book_name: string; chapter: number; verse: number; text: string }
export interface BibleChapter { reference: string; verses: BibleVerse[]; text: string }

export interface BibleNote {
  id: string; userId: string; book: string; chapter: number;
  verse?: number; content: string; highlight?: string; createdAt: string;
}

export interface Devotional {
  id: string; date: string; title: string; verse: string;
  verseText: string; content: string; prayer?: string;
}

export interface ReadingPlan {
  id: string; name: string; description?: string; durationDays: number;
  schedule: { day: number; passages: string[] }[];
  progress?: { currentDay: number; completedAt?: string; lastReadAt?: string } | null;
}

export interface JournalEntry {
  id: string; userId: string; title?: string; content: string;
  isPrayer: boolean; isAnswered: boolean; answeredAt?: string;
  sharedGroupId?: string; createdAt: string; updatedAt: string;
}

export interface Group {
  id: string; name: string; description?: string; avatarUrl?: string;
  isPrivate: boolean; createdById: string; role?: string;
  _count?: { members: number };
}

export interface GroupMessage {
  id: string; groupId: string; userId: string; content: string; createdAt: string;
  user: { id: string; name?: string; avatarUrl?: string };
}

export interface Friend {
  id: string; name?: string; avatarUrl?: string; email: string;
}

export interface DirectMessage {
  id: string; conversationId: string; senderId: string; content: string;
  isRead: boolean; createdAt: string;
  sender: { id: string; name?: string; avatarUrl?: string };
}

export interface AIConversation {
  id: string; title?: string; createdAt: string; updatedAt: string;
}

export interface SubscriptionStatus {
  status: "trialing" | "active" | "past_due" | "canceled" | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
}

export interface UserProfile {
  id: string; email: string; name?: string; avatarUrl?: string;
  referralCode: string; createdAt: string;
  streak?: { currentStreak: number; longestStreak: number; lastActivityAt?: string };
  subscription?: SubscriptionStatus;
}

export interface PrayerRequest {
  id: string; userId: string; groupId?: string; content: string;
  isAnswered: boolean; answeredAt?: string; isPublic: boolean; createdAt: string;
  user: { id: string; name?: string; avatarUrl?: string };
}

// ─── Bible ────────────────────────────────────────────────────────────────────
export const bibleApi = {
  books: () => apiFetch<{ books: BibleBook[] }>("/api/bible/books"),
  chapter: (book: string, chapter: number, translation = "kjv") =>
    apiFetch<BibleChapter>(`/api/bible/${encodeURIComponent(book)}/${chapter}?translation=${translation}`),
  search: (q: string, translation = "kjv") =>
    apiFetch<{ verses: BibleVerse[] }>(`/api/bible/search?q=${encodeURIComponent(q)}&translation=${translation}`),
};

// ─── Notes ────────────────────────────────────────────────────────────────────
export const notesApi = {
  list: (book?: string, chapter?: number) => {
    const qs = new URLSearchParams();
    if (book) qs.set("book", book);
    if (chapter) qs.set("chapter", String(chapter));
    return apiFetch<{ notes: BibleNote[] }>(`/api/notes?${qs}`);
  },
  create: (data: Partial<BibleNote>) =>
    apiFetch<{ note: BibleNote }>("/api/notes", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<BibleNote>) =>
    apiFetch<{ note: BibleNote }>(`/api/notes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/notes/${id}`, { method: "DELETE" }),
};

// ─── Devotionals ──────────────────────────────────────────────────────────────
export const devotionalsApi = {
  today: () => apiFetch<{ devotional: Devotional }>("/api/devotionals/today"),
  list: (limit?: number) =>
    apiFetch<{ devotionals: Devotional[] }>(`/api/devotionals${limit ? `?limit=${limit}` : ""}`),
};

// ─── Reading Plans ────────────────────────────────────────────────────────────
export const plansApi = {
  list: () => apiFetch<{ plans: ReadingPlan[] }>("/api/plans"),
  start: (id: string) => apiFetch<{ progress: object }>(`/api/plans/${id}/start`, { method: "POST" }),
  completeDay: (id: string) =>
    apiFetch<{ progress: object }>(`/api/plans/${id}/complete-day`, { method: "POST" }),
};

// ─── Journal ──────────────────────────────────────────────────────────────────
export const journalApi = {
  list: (isPrayer?: boolean) =>
    apiFetch<{ entries: JournalEntry[] }>(`/api/journal${isPrayer !== undefined ? `?isPrayer=${isPrayer}` : ""}`),
  create: (data: { title?: string; content: string; isPrayer?: boolean }) =>
    apiFetch<{ entry: JournalEntry }>("/api/journal", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<JournalEntry>) =>
    apiFetch<{ entry: JournalEntry }>(`/api/journal/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/journal/${id}`, { method: "DELETE" }),
  markAnswered: (id: string) =>
    apiFetch<{ entry: JournalEntry }>(`/api/journal/${id}/mark-answered`, { method: "POST" }),
  shareToGroup: (id: string, groupId: string) =>
    apiFetch<{ entry: JournalEntry }>(`/api/journal/${id}/share`, { method: "POST", body: JSON.stringify({ groupId }) }),
};

// ─── Groups ───────────────────────────────────────────────────────────────────
export const groupsApi = {
  list: () => apiFetch<{ groups: Group[] }>("/api/groups"),
  create: (data: { name: string; description?: string; isPrivate?: boolean }) =>
    apiFetch<{ group: Group }>("/api/groups", { method: "POST", body: JSON.stringify(data) }),
  get: (id: string) => apiFetch<{ group: Group }>(`/api/groups/${id}`),
  messages: (id: string, cursor?: string) =>
    apiFetch<{ messages: GroupMessage[]; nextCursor: string | null }>(
      `/api/groups/${id}/messages${cursor ? `?cursor=${cursor}` : ""}`
    ),
  sendMessage: (id: string, content: string) =>
    apiFetch<{ message: GroupMessage }>(`/api/groups/${id}/messages`, {
      method: "POST", body: JSON.stringify({ content }),
    }),
  postAnnouncement: (id: string, content: string) =>
    apiFetch<{ announcement: object }>(`/api/groups/${id}/announcements`, {
      method: "POST", body: JSON.stringify({ content }),
    }),
  postAssignment: (id: string, data: { passage: string; dueDate?: string; notes?: string }) =>
    apiFetch<{ assignment: object }>(`/api/groups/${id}/assignments`, {
      method: "POST", body: JSON.stringify(data),
    }),
};

// ─── Friends ──────────────────────────────────────────────────────────────────
export const friendsApi = {
  list: () => apiFetch<{ friends: Friend[] }>("/api/friends"),
  requests: () => apiFetch<{ requests: object[] }>("/api/friends/requests"),
  sendRequest: (receiverId: string) =>
    apiFetch<{ request: object }>("/api/friends/requests", { method: "POST", body: JSON.stringify({ receiverId }) }),
  respondRequest: (id: string, action: "accept" | "decline") =>
    apiFetch<{ request: object }>(`/api/friends/requests/${id}`, { method: "PATCH", body: JSON.stringify({ action }) }),
  search: (q: string) =>
    apiFetch<{ users: Friend[] }>(`/api/friends/search?q=${encodeURIComponent(q)}`),
  remove: (userId: string) =>
    apiFetch<{ success: boolean }>(`/api/friends/${userId}`, { method: "DELETE" }),
};

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messagesApi = {
  conversations: () => apiFetch<{ conversations: object[] }>("/api/messages"),
  list: (conversationId: string, cursor?: string) =>
    apiFetch<{ messages: DirectMessage[]; nextCursor: string | null }>(
      `/api/messages/${conversationId}${cursor ? `?cursor=${cursor}` : ""}`
    ),
  send: (receiverId: string, content: string) =>
    apiFetch<{ message: DirectMessage }>(`/api/messages/${receiverId}`, {
      method: "POST", body: JSON.stringify({ content }),
    }),
};

// ─── AI ───────────────────────────────────────────────────────────────────────
export const aiApi = {
  conversations: () => apiFetch<{ conversations: AIConversation[] }>("/api/ai/conversations"),
  create: () => apiFetch<{ conversation: AIConversation }>("/api/ai/conversations", { method: "POST" }),
  get: (id: string) => apiFetch<{ conversation: AIConversation & { messages: object[] } }>(`/api/ai/conversations/${id}`),
  delete: (id: string) => apiFetch<{ success: boolean }>(`/api/ai/conversations/${id}`, { method: "DELETE" }),
  /** Returns an EventSource URL — caller handles SSE manually */
  messageUrl: (conversationId: string) => `${BASE_URL}/api/ai/conversations/${conversationId}/messages`,
};

// ─── Subscription ─────────────────────────────────────────────────────────────
export const subscriptionApi = {
  status: () => apiFetch<SubscriptionStatus>("/api/subscription"),
  create: (priceId: string) =>
    apiFetch<{ setupIntentClientSecret: string; customerId: string; subscriptionId: string }>(
      "/api/subscription", { method: "POST", body: JSON.stringify({ priceId }) }
    ),
  cancel: () => apiFetch<{ success: boolean }>("/api/subscription", { method: "DELETE" }),
};

// ─── Referrals ────────────────────────────────────────────────────────────────
export const referralsApi = {
  get: () =>
    apiFetch<{ referralCode: string; totalReferrals: number; rewardedReferrals: number }>("/api/referrals"),
  validate: (code: string) =>
    apiFetch<{ valid: boolean; referrer: object | null }>("/api/referrals/validate", {
      method: "POST", body: JSON.stringify({ code }),
    }),
};

// ─── Account ──────────────────────────────────────────────────────────────────
export const accountApi = {
  get: () => apiFetch<{ user: UserProfile }>("/api/account"),
  update: (data: { name?: string; avatarUrl?: string }) =>
    apiFetch<{ user: UserProfile }>("/api/account", { method: "PATCH", body: JSON.stringify(data) }),
  delete: () => apiFetch<{ success: boolean }>("/api/account", { method: "DELETE" }),
};

// ─── Auth (register) ─────────────────────────────────────────────────────────
export const authApi = {
  register: (name?: string, referralCode?: string) =>
    apiFetch<{ user: UserProfile }>("/api/auth/register", {
      method: "POST", body: JSON.stringify({ name, referralCode }),
    }),
};

// ─── Prayer ───────────────────────────────────────────────────────────────────
export const prayerApi = {
  list: (groupId?: string) =>
    apiFetch<{ prayerRequests: PrayerRequest[] }>(
      `/api/prayer-requests${groupId ? `?groupId=${groupId}` : ""}`
    ),
  create: (data: { content: string; groupId?: string; isPublic?: boolean }) =>
    apiFetch<{ prayerRequest: PrayerRequest }>("/api/prayer-requests", {
      method: "POST", body: JSON.stringify(data),
    }),
  markAnswered: (id: string) =>
    apiFetch<{ prayerRequest: PrayerRequest }>(`/api/prayer-requests/${id}/mark-answered`, { method: "PATCH" }),
  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/prayer-requests/${id}`, { method: "DELETE" }),
};

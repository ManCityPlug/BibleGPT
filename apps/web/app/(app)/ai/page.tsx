"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import styles from "./ai.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Conversation { id: string; title?: string; createdAt: string }
interface Message { role: "user" | "assistant"; content: string }

export default function AIPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push("/auth/login"); return; }
      setToken(data.session.access_token);
    });
  }, [router]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/ai/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then((d: { conversations: Conversation[] }) => setConversations(d.conversations ?? []))
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function openConversation(id: string) {
    if (!token) return;
    setActiveId(id);
    const res = await fetch(`${API_URL}/api/ai/conversations/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json() as { conversation: Conversation & { messages: { role: string; content: string }[] } };
    const msgs = (data.conversation.messages ?? []).map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    setMessages(msgs);
  }

  async function newConversation() {
    if (!token) return;
    const res = await fetch(`${API_URL}/api/ai/conversations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const data = await res.json() as { conversation: Conversation };
    setConversations(prev => [data.conversation, ...prev]);
    setActiveId(data.conversation.id);
    setMessages([]);
  }

  async function sendMessage() {
    if (!input.trim() || !activeId || !token || streaming) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setStreaming(true);

    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`${API_URL}/api/ai/conversations/${activeId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ content: userMsg }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") break;
            try {
              const parsed = JSON.parse(payload) as { delta?: string };
              if (parsed.delta) {
                setMessages(prev => {
                  const copy = [...prev];
                  copy[copy.length - 1] = {
                    ...copy[copy.length - 1],
                    content: copy[copy.length - 1].content + parsed.delta,
                  };
                  return copy;
                });
              }
            } catch { /* ignore parse errors */ }
          }
        }
      }
    } catch {
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: "Sorry, something went wrong. Please try again." };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/dashboard" className={styles.logo}>✝ BibleGPT</Link>
        <div className={styles.navLinks}>
          <Link href="/bible">Bible</Link>
          <Link href="/ai" className={styles.navActive}>AI Chat</Link>
          <Link href="/account">Account</Link>
        </div>
      </nav>

      <div className={styles.layout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Conversations</h2>
            <button className={styles.newBtn} onClick={newConversation}>+ New Chat</button>
          </div>
          <div className={styles.convList}>
            {loadingConvs ? (
              <div className={styles.loadingConvs}>Loading...</div>
            ) : conversations.length === 0 ? (
              <div className={styles.emptyConvs}>No conversations yet</div>
            ) : conversations.map(c => (
              <button
                key={c.id}
                className={`${styles.convItem} ${activeId === c.id ? styles.convItemActive : ""}`}
                onClick={() => openConversation(c.id)}
              >
                <span className={styles.convIcon}>💬</span>
                <span className={styles.convTitle}>{c.title ?? "Bible Study"}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat */}
        <main className={styles.chat}>
          {!activeId ? (
            <div className={styles.welcome}>
              <div className={styles.welcomeIcon}>🤖</div>
              <h2>Ask BibleGPT</h2>
              <p>Your AI-powered Bible study companion</p>
              <button className={styles.startBtn} onClick={newConversation}>Start a conversation</button>
            </div>
          ) : (
            <>
              <div className={styles.messages}>
                {messages.length === 0 && (
                  <div className={styles.emptyChat}>
                    <p>Ask anything about the Bible, theology, prayer, or your faith journey.</p>
                    <div className={styles.suggestions}>
                      {["What does the Bible say about forgiveness?", "Explain the Gospel of John", "Give me a prayer for strength"].map(s => (
                        <button key={s} className={styles.suggestion} onClick={() => { setInput(s); }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`${styles.message} ${m.role === "user" ? styles.userMessage : styles.assistantMessage}`}>
                    {m.role === "assistant" && <div className={styles.msgIcon}>✝</div>}
                    <div className={styles.msgBubble}>
                      {m.content || (streaming && i === messages.length - 1 ? <span className={styles.cursor}>▋</span> : "")}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className={styles.inputArea}>
                <textarea
                  className={styles.input}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask about Scripture, theology, prayer..."
                  rows={1}
                  disabled={streaming}
                />
                <button className={styles.sendBtn} onClick={sendMessage} disabled={!input.trim() || streaming}>
                  {streaming ? "..." : "Send"}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

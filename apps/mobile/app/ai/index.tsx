import { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { aiApi } from "@/lib/api";
import { colors, spacing, typography, radius } from "@/constants/theme";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What does John 3:16 mean?",
  "Give me a verse about peace",
  "Explain the Sermon on the Mount",
  "How do I start reading the Bible?",
];

export default function AIScreen() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    aiApi.create().then(({ conversation }) => setConversationId(conversation.id)).catch(console.error);
  }, []);

  async function sendMessage(text?: string) {
    const userMsg = (text ?? input).trim();
    if (!userMsg || !conversationId || streaming) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const url = aiApi.messageUrl(conversationId);

      // Use XHR for SSE — fetch body streaming is unreliable on Hermes/React Native
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);

        let processedLength = 0;

        xhr.onprogress = () => {
          const newChunk = xhr.responseText.slice(processedLength);
          processedLength = xhr.responseText.length;

          for (const line of newChunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;
            try {
              const parsed = JSON.parse(raw) as { text?: string; done?: boolean; error?: string };
              if (parsed.error) { reject(new Error(parsed.error)); return; }
              if (parsed.text) {
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: updated[updated.length - 1].content + parsed.text,
                  };
                  return updated;
                });
              }
            } catch { /* skip malformed chunk */ }
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 400) reject(new Error(`Server error ${xhr.status}`));
          else resolve();
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(JSON.stringify({ content: userMsg }));
      });
    } catch (err) {
      console.error("AI error:", err);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, I couldn't reach the server. Please check your connection and try again.",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  function renderMessage({ item }: { item: ChatMessage }) {
    const isUser = item.role === "user";
    return (
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {!isUser && (
          <View style={styles.aiLabel}>
            <Text style={styles.aiLabelIcon}>✝</Text>
            <Text style={styles.aiLabelText}>BibleGPT</Text>
          </View>
        )}
        {item.content ? (
          <Text style={[styles.bubbleText, isUser ? styles.userText : styles.aiText]}>
            {item.content}
          </Text>
        ) : (
          <View style={styles.typingRow}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.typingText}>Searching scripture…</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>✝ BibleGPT</Text>
          <Text style={styles.headerSub}>Your AI Bible companion</Text>
        </View>

        {/* Empty state */}
        {messages.length === 0 && (
          <View style={styles.welcome}>
            <Text style={styles.welcomeText}>
              Ask me anything about the Bible — passages, theology, history, devotionals, or life guidance from scripture.
            </Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.chip}
                  onPress={() => sendMessage(s)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.messageList}
          renderItem={renderMessage}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about the Bible..."
            placeholderTextColor={colors.textTertiary}
            multiline
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || streaming) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || streaming}
          >
            {streaming
              ? <ActivityIndicator color={colors.white} size="small" />
              : <Text style={styles.sendIcon}>↑</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: colors.background },
  flex:  { flex: 1 },

  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerTitle: { fontSize: typography.xl, fontWeight: "700", color: colors.primary },
  headerSub:   { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },

  welcome: { padding: spacing.xl, paddingBottom: 0 },
  welcomeText: {
    fontSize: typography.base, color: colors.textSecondary,
    lineHeight: typography.base * 1.6, marginBottom: spacing.lg,
  },
  suggestions: { gap: spacing.sm },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  chipText: { color: colors.primary, fontSize: typography.sm, fontWeight: "500" },

  messageList: { padding: spacing.base, paddingBottom: spacing.lg },

  bubble: { marginVertical: spacing.xs, maxWidth: "85%", borderRadius: radius.xl, padding: spacing.md },
  userBubble: { alignSelf: "flex-end", backgroundColor: colors.primary },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  aiLabel: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.xs },
  aiLabelIcon: { fontSize: 12, color: colors.primary },
  aiLabelText: { fontSize: typography.xs, fontWeight: "700", color: colors.primary },
  bubbleText: { fontSize: typography.base, lineHeight: typography.base * 1.6 },
  userText:   { color: colors.textInverse },
  aiText:     { color: colors.text },
  typingRow:  { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  typingText: { fontSize: typography.sm, color: colors.textSecondary },

  inputBar: {
    flexDirection: "row", alignItems: "flex-end",
    gap: spacing.sm, padding: spacing.base,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1, backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    fontSize: typography.base, color: colors.text,
    borderWidth: 1, borderColor: colors.border,
    maxHeight: 100, minHeight: 44,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: radius.full,
    backgroundColor: colors.primary, justifyContent: "center", alignItems: "center",
  },
  sendBtnDisabled: { opacity: 0.35 },
  sendIcon: { color: colors.white, fontSize: typography.xl, fontWeight: "700" },
});

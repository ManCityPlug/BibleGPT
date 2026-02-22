import { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { aiApi } from "@/lib/api";
import { colors, spacing, typography, radius } from "@/constants/theme";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AIScreen() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    // Create new conversation on mount
    aiApi.create().then(({ conversation }) => setConversationId(conversation.id)).catch(console.error);
  }, []);

  async function sendMessage() {
    if (!input.trim() || !conversationId || streaming) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setStreaming(true);

    // Append placeholder for streaming assistant response
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const url = aiApi.messageUrl(conversationId);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ content: userMsg }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (!data.trim()) continue;

          try {
            const parsed = JSON.parse(data) as { text?: string; done?: boolean; error?: string };
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.done) break;
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
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } catch (err) {
      console.error("Stream error:", err);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
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
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {!isUser && <Text style={styles.bubbleLabel}>✝ BibleGPT</Text>}
        {item.content ? (
          <Text style={[styles.bubbleText, isUser ? styles.userText : styles.assistantText]}>
            {item.content}
          </Text>
        ) : (
          <ActivityIndicator color={colors.primary} size="small" />
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>✝ BibleGPT</Text>
        <Text style={styles.headerSub}>Your AI Bible companion</Text>
      </View>

      {messages.length === 0 && (
        <View style={styles.welcome}>
          <Text style={styles.welcomeText}>
            Ask me anything about the Bible — passages, theology, history, devotionals, or life guidance from scripture.
          </Text>
          {[
            "What does John 3:16 mean?",
            "Give me a verse about peace",
            "Explain the Sermon on the Mount",
          ].map((prompt) => (
            <TouchableOpacity key={prompt} style={styles.suggestionBtn} onPress={() => { setInput(prompt); }}>
              <Text style={styles.suggestionText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.messages}
        renderItem={renderMessage}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about the Bible..."
          placeholderTextColor={colors.textTertiary}
          multiline
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || streaming) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || streaming}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing["4xl"], paddingBottom: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: typography.xl, fontWeight: "700", color: colors.primary },
  headerSub: { fontSize: typography.sm, color: colors.textSecondary },
  welcome: { padding: spacing.xl },
  welcomeText: { fontSize: typography.base, color: colors.textSecondary, lineHeight: typography.base * 1.6, marginBottom: spacing.xl },
  suggestionBtn: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  suggestionText: { color: colors.primary, fontSize: typography.sm, fontWeight: "500" },
  messages: { padding: spacing.base, paddingBottom: spacing.xl },
  bubble: { marginVertical: spacing.xs, maxWidth: "85%", borderRadius: radius.xl, padding: spacing.md },
  userBubble: { alignSelf: "flex-end", backgroundColor: colors.primary },
  assistantBubble: { alignSelf: "flex-start", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  bubbleLabel: { fontSize: typography.xs, color: colors.primary, fontWeight: "700", marginBottom: spacing.xs },
  bubbleText: { fontSize: typography.base, lineHeight: typography.base * 1.6 },
  userText: { color: colors.textInverse },
  assistantText: { color: colors.text },
  inputRow: { flexDirection: "row", gap: spacing.sm, padding: spacing.base, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  input: { flex: 1, backgroundColor: colors.white, borderRadius: radius.xl, paddingHorizontal: spacing.base, paddingVertical: spacing.sm, fontSize: typography.base, color: colors.text, borderWidth: 1, borderColor: colors.border, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: colors.textInverse, fontSize: typography.xl, fontWeight: "700" },
});

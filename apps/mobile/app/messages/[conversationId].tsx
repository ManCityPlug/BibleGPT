import { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { messagesApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { DirectMessage } from "@/lib/api";
import { colors, spacing, typography, radius } from "@/constants/theme";

export default function DMScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState("");
  const listRef = useRef<FlatList>(null);

  // conversationId = "userId1_userId2" — extract other user ID
  const otherId = userId
    ? conversationId.split("_").find((id) => id !== userId) ?? ""
    : "";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user.id) setUserId(data.session.user.id);
    });

    messagesApi.list(conversationId).then(({ messages }) => {
      setMessages(messages);
      setLoading(false);
    });

    // Realtime subscription
    const channel = supabase
      .channel(`dm-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const msg = payload.new as DirectMessage;
          setMessages((prev) => {
            if (prev.find((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  async function sendMessage() {
    if (!input.trim() || sending || !otherId) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    try {
      await messagesApi.send(otherId, content);
    } finally {
      setSending(false);
    }
  }

  function renderMessage({ item }: { item: DirectMessage }) {
    const isMe = item.senderId === userId;
    return (
      <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
        <Text style={[styles.msgText, isMe && styles.myText]}>{item.content}</Text>
        <Text style={[styles.msgTime, isMe && styles.myTime]}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
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
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Direct Message</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.msgList}
          renderItem={renderMessage}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Message..."
          placeholderTextColor={colors.textTertiary}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || sending}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.base, paddingTop: spacing["4xl"], paddingBottom: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { fontSize: typography.xl, color: colors.primary, width: 40 },
  headerTitle: { fontSize: typography.md, fontWeight: "700", color: colors.text },
  msgList: { padding: spacing.base, gap: spacing.sm, paddingBottom: spacing.xl },
  bubble: { maxWidth: "80%", borderRadius: radius.xl, padding: spacing.md },
  myBubble: { alignSelf: "flex-end", backgroundColor: colors.primary },
  theirBubble: { alignSelf: "flex-start", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  msgText: { fontSize: typography.base, color: colors.text, lineHeight: typography.base * 1.5 },
  myText: { color: colors.textInverse },
  msgTime: { fontSize: typography.xs, color: colors.textTertiary, marginTop: spacing.xs, alignSelf: "flex-end" },
  myTime: { color: "rgba(255,255,255,0.6)" },
  inputRow: { flexDirection: "row", gap: spacing.sm, padding: spacing.base, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  input: { flex: 1, backgroundColor: colors.white, borderRadius: radius.xl, paddingHorizontal: spacing.base, paddingVertical: spacing.sm, fontSize: typography.base, color: colors.text, borderWidth: 1, borderColor: colors.border, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: colors.textInverse, fontSize: typography.xl, fontWeight: "700" },
});

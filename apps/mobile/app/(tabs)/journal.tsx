import { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Modal, Alert,
} from "react-native";
import { journalApi } from "@/lib/api";
import type { JournalEntry } from "@/lib/api";
import { colors, spacing, typography, radius, shadows } from "@/constants/theme";

export default function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"journal" | "prayer">("journal");
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const { entries } = await journalApi.list(tab === "prayer");
      setEntries(entries);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, [tab]);

  async function saveEntry() {
    if (!newContent.trim()) { Alert.alert("Error", "Content required"); return; }
    setSaving(true);
    try {
      await journalApi.create({ title: newTitle || undefined, content: newContent, isPrayer: tab === "prayer" });
      setNewTitle("");
      setNewContent("");
      setShowNew(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  function formatDate(str: string) {
    return new Date(str).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{tab === "journal" ? "Journal" : "Prayer"}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowNew(true)}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {(["journal", "prayer"] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "journal" ? "📝 Journal" : "🙏 Prayer"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>{tab === "journal" ? "📝" : "🙏"}</Text>
              <Text style={styles.emptyText}>No {tab} entries yet</Text>
              <TouchableOpacity onPress={() => setShowNew(true)}>
                <Text style={styles.emptyAction}>Write your first entry →</Text>
              </TouchableOpacity>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.title && <Text style={styles.entryTitle}>{item.title}</Text>}
              <Text style={styles.entryContent} numberOfLines={3}>{item.content}</Text>
              <View style={styles.entryMeta}>
                <Text style={styles.entryDate}>{formatDate(item.createdAt)}</Text>
                {item.isAnswered && <Text style={styles.answeredBadge}>✓ Answered</Text>}
              </View>
            </View>
          )}
        />
      )}

      {/* New Entry Modal */}
      <Modal visible={showNew} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNew(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New {tab === "journal" ? "Entry" : "Prayer"}</Text>
            <TouchableOpacity onPress={saveEntry} disabled={saving}>
              <Text style={[styles.modalSave, saving && { opacity: 0.5 }]}>Save</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.titleInput}
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="Title (optional)"
            placeholderTextColor={colors.textTertiary}
          />
          <TextInput
            style={styles.contentInput}
            value={newContent}
            onChangeText={setNewContent}
            placeholder={tab === "journal" ? "What's on your heart today?" : "Share your prayer..."}
            placeholderTextColor={colors.textTertiary}
            multiline
            textAlignVertical="top"
            autoFocus
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.xl, paddingTop: spacing["4xl"], paddingBottom: spacing.base },
  title: { fontSize: typography["2xl"], fontWeight: "700", color: colors.text },
  addBtn: { backgroundColor: colors.primary, borderRadius: radius.full, width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  addBtnText: { color: colors.textInverse, fontSize: typography.xl, fontWeight: "700" },
  tabs: { flexDirection: "row", paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.base },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: typography.sm, fontWeight: "600", color: colors.textSecondary },
  tabTextActive: { color: colors.textInverse },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing["4xl"], gap: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.base, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  entryTitle: { fontSize: typography.md, fontWeight: "700", color: colors.text, marginBottom: spacing.xs },
  entryContent: { fontSize: typography.base, color: colors.textSecondary, lineHeight: typography.base * 1.5 },
  entryMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md },
  entryDate: { fontSize: typography.xs, color: colors.textTertiary },
  answeredBadge: { fontSize: typography.xs, color: colors.success, fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: spacing["4xl"] },
  emptyIcon: { fontSize: typography["4xl"] },
  emptyText: { fontSize: typography.lg, fontWeight: "700", color: colors.text, marginTop: spacing.base },
  emptyAction: { color: colors.primary, fontWeight: "600", marginTop: spacing.sm },
  modal: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.xl },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.xl, paddingBottom: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalCancel: { color: colors.textSecondary, fontSize: typography.base },
  modalTitle: { fontSize: typography.md, fontWeight: "700", color: colors.text },
  modalSave: { color: colors.primary, fontSize: typography.base, fontWeight: "700" },
  titleInput: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, fontSize: typography.xl, fontWeight: "600", color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.border },
  contentInput: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.base, fontSize: typography.base, color: colors.text, lineHeight: typography.base * 1.7 },
});

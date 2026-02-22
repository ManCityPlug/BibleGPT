import { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { groupsApi, friendsApi } from "@/lib/api";
import type { Group, Friend } from "@/lib/api";
import { colors, spacing, typography, radius, shadows } from "@/constants/theme";

export default function CommunityScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"groups" | "friends">("groups");

  async function load() {
    try {
      const [groupsRes, friendsRes] = await Promise.allSettled([
        groupsApi.list(),
        friendsApi.list(),
      ]);
      if (groupsRes.status === "fulfilled") setGroups(groupsRes.value.groups);
      if (friendsRes.status === "fulfilled") setFriends(friendsRes.value.friends);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push(tab === "groups" ? "/groups/new" : "/friends/search" as never)}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["groups", "friends"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "groups" ? "Groups" : "Friends"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "groups" ? (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏛️</Text>
              <Text style={styles.emptyText}>No groups yet</Text>
              <Text style={styles.emptySubtext}>Join or create a Bible study group</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/groups/${item.id}` as never)}
            >
              <Text style={styles.groupName}>{item.name}</Text>
              {item.description && <Text style={styles.groupDesc} numberOfLines={2}>{item.description}</Text>}
              <View style={styles.groupMeta}>
                <Text style={styles.groupMetaText}>{item._count?.members ?? 0} members</Text>
                {item.isPrivate && <Text style={styles.privateBadge}>🔒 Private</Text>}
                <Text style={styles.roleBadge}>{item.role}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(f) => f.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🤝</Text>
              <Text style={styles.emptyText}>No friends yet</Text>
              <Text style={styles.emptySubtext}>Search for friends by name or email</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/messages/${item.id}` as never)}
            >
              <View style={styles.friendRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(item.name ?? item.email)[0].toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.friendName}>{item.name ?? item.email}</Text>
                  <Text style={styles.friendEmail}>{item.email}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.xl, paddingTop: spacing["4xl"], paddingBottom: spacing.base },
  title: { fontSize: typography["2xl"], fontWeight: "700", color: colors.text },
  addBtn: { backgroundColor: colors.primary, borderRadius: radius.full, width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  addBtnText: { color: colors.textInverse, fontSize: typography.xl, fontWeight: "700", lineHeight: 36 },
  tabs: { flexDirection: "row", paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.base },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: typography.sm, fontWeight: "600", color: colors.textSecondary },
  tabTextActive: { color: colors.textInverse },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing["4xl"], gap: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.base, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  groupName: { fontSize: typography.md, fontWeight: "700", color: colors.text },
  groupDesc: { fontSize: typography.sm, color: colors.textSecondary, marginTop: spacing.xs },
  groupMeta: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, flexWrap: "wrap" },
  groupMetaText: { fontSize: typography.xs, color: colors.textTertiary },
  privateBadge: { fontSize: typography.xs, color: colors.textSecondary },
  roleBadge: { fontSize: typography.xs, color: colors.primary, fontWeight: "600", textTransform: "capitalize" },
  empty: { alignItems: "center", paddingTop: spacing["4xl"] },
  emptyIcon: { fontSize: typography["4xl"] },
  emptyText: { fontSize: typography.lg, fontWeight: "700", color: colors.text, marginTop: spacing.base },
  emptySubtext: { fontSize: typography.sm, color: colors.textSecondary, marginTop: spacing.sm },
  friendRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.primaryBg, justifyContent: "center", alignItems: "center" },
  avatarText: { color: colors.primary, fontSize: typography.md, fontWeight: "700" },
  friendName: { fontSize: typography.base, fontWeight: "600", color: colors.text },
  friendEmail: { fontSize: typography.sm, color: colors.textSecondary },
});

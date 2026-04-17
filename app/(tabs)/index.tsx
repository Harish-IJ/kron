import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS, RADII, SHADOWS, TYPOGRAPHY } from "@/constants/theme";
import { useLoggingContext } from "@/contexts/LoggingContext";
import type { StreakCard } from "@/db/types";
import { useStreaks } from "@/hooks/useStreaks";

export default function HomeScreen() {
  const router = useRouter();
  const { streaks, isLoading, isRefreshing, isEmpty, refresh } = useStreaks();
  const { openLoggingSheet } = useLoggingContext();

  const handleGlobalLog = () => {
    const targetStreak =
      streaks.find((s) => s.pendingToday)?.streak || streaks[0]?.streak;
    if (targetStreak) {
      openLoggingSheet(targetStreak.id, "media");
    }
  };

  // === Empty State ===
  if (isEmpty) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🌱</Text>
        <Text style={styles.emptyTitle}>Start your first ritual</Text>
        <Text style={styles.emptySubtext}>
          Begin an intentional sequence of growth
        </Text>
        <Pressable
          style={styles.emptyButton}
          onPress={() => router.push("/create-streak")}>
          <Text style={styles.emptyButtonText}>Create Streak</Text>
        </Pressable>
      </View>
    );
  }

  // === Loading State ===
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading rituals…</Text>
      </View>
    );
  }

  const topStreakData = streaks[0];
  const pendingCount = streaks.filter((s) => s.pendingToday).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons
            name='menu'
            size={24}
            color={COLORS.primary}
            style={{ marginRight: 16 }}
          />
          <Text style={styles.headerTitle}>The Quiet Ritual</Text>
        </View>
        <Pressable
          style={styles.headerButton}
          onPress={() => router.push("/create-streak")}>
          <MaterialIcons name='add' size={28} color={COLORS.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        {topStreakData && (
          <View style={styles.heroSection}>
            <View style={styles.heroRow}>
              <Text style={styles.heroNumber}>
                {topStreakData.streak.currentStreak}
              </Text>
              <Text style={styles.heroLabel}>Day Streak</Text>
            </View>
            <Text style={styles.heroSubtext}>
              Your mindful habit of {topStreakData.streak.name.toLowerCase()} is
              flourishing.
            </Text>
          </View>
        )}

        {/* Streaks Week Maps */}
        <View style={styles.weekMapsContainer}>
          {streaks.map((card) => (
            <StreakCardItem
              key={card.streak.id}
              card={card}
              onPress={() => router.push(`/streak/${card.streak.id}`)}
            />
          ))}
        </View>

        {/* Bento Preview Section */}
        <View style={styles.bentoSection}>
          <View style={styles.bentoHero}>
            <Text style={styles.bentoLabel}>Latest Proof</Text>
            <View style={styles.bentoImagePlaceholder}>
              <MaterialIcons
                name='image'
                size={32}
                color={COLORS.outlineVariant}
              />
              <View style={styles.bentoOverlay}>
                <Text style={styles.bentoOverlayText}>Media Archive</Text>
              </View>
            </View>
          </View>

          <View style={styles.bentoGridRow}>
            <View style={styles.bentoSquarePrimary}>
              <MaterialIcons
                name='auto-stories'
                size={24}
                color={COLORS.onSecondaryContainer}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.bentoSquareNumber}>{streaks.length}</Text>
              <Text style={styles.bentoSquareLabel}>Total Rituals</Text>
            </View>
            <View style={styles.bentoSquareSecondary}>
              <MaterialIcons
                name='mood'
                size={24}
                color={COLORS.onTertiaryContainer}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.bentoSquareText}>Reflective</Text>
              <Text style={styles.bentoSquareLabelTertiary}>Primary Mood</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FAB - Global Camera Log */}
      <Pressable style={styles.fab} onPress={handleGlobalLog}>
        <MaterialIcons name='photo-camera' size={24} color={COLORS.onPrimary} />
      </Pressable>
    </View>
  );
}

// === Streak Card Component ===

function StreakCardItem({
  card,
  onPress,
}: {
  card: StreakCard;
  onPress: () => void;
}) {
  const { streak, weekSummary } = card;

  // Convert "2026-04-18" visually to "Mon", etc.
  const getDayLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  };
  const getDayNumber = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getDate();
  };

  return (
    <View style={styles.weekGroup}>
      <View style={styles.weekHeader}>
        <Text style={styles.weekTitle}>{streak.name}</Text>
        <Text style={styles.weekRange}>{streak.emoji}</Text>
      </View>
      <Pressable style={styles.card} onPress={onPress}>
        <View style={styles.daysRow}>
          {weekSummary.map((day) => {
            const isToday = new Date().toISOString().split("T")[0] === day.date;

            return (
              <View key={day.date} style={styles.dayCol}>
                <Text
                  style={[
                    styles.dayLabelTxt,
                    isToday && styles.dayLabelTxtToday,
                  ]}>
                  {getDayLabel(day.date)}
                </Text>

                {day.dayStatus === "achieved" && (
                  <View style={styles.circleAchieved}>
                    <MaterialIcons
                      name='check'
                      size={16}
                      color={COLORS.onPrimary}
                    />
                  </View>
                )}

                {day.dayStatus === "not_achieved" && (
                  <View style={styles.circleMissed}>
                    <View style={styles.missedDot} />
                  </View>
                )}

                {(day.dayStatus === "pending" || day.dayStatus === "missed") &&
                  isToday && (
                    <View style={styles.circleToday}>
                      <Text style={styles.circleTodayTxt}>
                        {getDayNumber(day.date)}
                      </Text>
                    </View>
                  )}

                {(day.dayStatus === "pending" || day.dayStatus === "missed") &&
                  !isToday && <View style={styles.circlePending} />}
              </View>
            );
          })}
        </View>
      </Pressable>
    </View>
  );
}

// === Styles ===

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { ...TYPOGRAPHY.bodyLg, color: COLORS.onSurfaceVariant },

  // Header
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(248, 249, 249, 0.7)",
    zIndex: 50,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerTitle: {
    ...TYPOGRAPHY.titleMd,
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: RADII.full,
    backgroundColor: COLORS.surfaceContainerHighest,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  // Main scroll map
  list: { paddingHorizontal: 24, paddingBottom: 160 },

  // Hero Section
  heroSection: { marginBottom: 48, marginTop: 24 },
  heroRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 16,
    marginBottom: 8,
  },
  heroNumber: {
    ...TYPOGRAPHY.displayLg,
    color: COLORS.primary,
    lineHeight: 60,
  },
  heroLabel: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.onSurfaceVariant,
    textTransform: "uppercase",
  },
  heroSubtext: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.onSurfaceVariant,
    marginLeft: 16,
    maxWidth: 200,
  },

  // Week Layout
  weekMapsContainer: { gap: 32 },
  weekGroup: { gap: 16 },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  weekTitle: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.onSurfaceVariant,
    textTransform: "uppercase",
  },
  weekRange: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.outline,
    textTransform: "uppercase",
  },

  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADII.md,
    padding: 24,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayCol: { alignItems: "center", gap: 12 },
  dayLabelTxt: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: COLORS.outline,
    textTransform: "uppercase",
  },
  dayLabelTxtToday: { color: COLORS.primary, fontFamily: "Inter_700Bold" },

  circleAchieved: {
    width: 40,
    height: 40,
    borderRadius: RADII.full,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  circleMissed: {
    width: 40,
    height: 40,
    borderRadius: RADII.full,
    justifyContent: "center",
    alignItems: "center",
  },
  missedDot: {
    width: 8,
    height: 8,
    borderRadius: RADII.full,
    backgroundColor: COLORS.tertiary,
  },
  circleToday: {
    width: 40,
    height: 40,
    borderRadius: RADII.full,
    borderWidth: 2,
    borderColor: "#c7eae1", // primary-container
    backgroundColor: COLORS.surfaceContainerLowest,
    justifyContent: "center",
    alignItems: "center",
  },
  circleTodayTxt: { ...TYPOGRAPHY.titleSm, color: COLORS.primary },
  circlePending: {
    width: 40,
    height: 40,
    borderRadius: RADII.full,
    backgroundColor: COLORS.surfaceContainerLow,
  },

  // Bento
  bentoSection: { gap: 16, marginTop: 48 },
  bentoHero: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADII.md,
    padding: 24,
  },
  bentoLabel: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  bentoImagePlaceholder: {
    aspectRatio: 16 / 9,
    width: "100%",
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceContainerHighest,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  bentoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  bentoOverlayText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.5,
  },

  bentoGridRow: { flexDirection: "row", gap: 16 },
  bentoSquarePrimary: {
    flex: 1,
    backgroundColor: COLORS.secondaryContainer,
    borderRadius: RADII.md,
    padding: 24,
  },
  bentoSquareNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.onSecondaryContainer,
  },
  bentoSquareLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    tracking: 1,
    color: COLORS.onSecondaryContainer,
    opacity: 0.7,
  },

  bentoSquareSecondary: {
    flex: 1,
    backgroundColor: "rgba(253, 173, 154, 0.3)",
    borderRadius: RADII.md,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(253, 173, 154, 0.2)",
  },
  bentoSquareText: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.onTertiaryContainer,
  },
  bentoSquareLabelTertiary: {
    fontSize: 10,
    textTransform: "uppercase",
    tracking: 1,
    color: COLORS.onTertiaryContainer,
    opacity: 0.7,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 32,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 24 },
  emptyTitle: {
    ...TYPOGRAPHY.displaySm,
    textAlign: "center",
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  emptySubtext: {
    ...TYPOGRAPHY.bodyLg,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: RADII.full,
    ...SHADOWS.floating,
  },
  emptyButtonText: {
    ...TYPOGRAPHY.bodyLg,
    color: COLORS.surfaceContainerHighest,
    fontWeight: "600",
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 112,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: RADII.full,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.onSurface,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 8,
    zIndex: 60,
  },
});

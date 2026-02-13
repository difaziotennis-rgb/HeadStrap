import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Vault,
  HardDrive,
  Clock,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Mic,
} from "lucide-react-native";
import { getEarnings } from "../services/mockBackend";
import { COLORS } from "../constants/theme";
import { Earnings, Session } from "../types";

export default function VaultScreen() {
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadEarnings = useCallback(async () => {
    const data = await getEarnings();
    setEarnings(data);
  }, []);

  useEffect(() => {
    loadEarnings();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEarnings();
    setRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!earnings) return null;

  return (
    <LinearGradient
      colors={[COLORS.darkBg, "#0D1117", COLORS.darkBg]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {/* Header */}
          <View style={styles.header}>
            <Vault size={22} color={COLORS.emerald} />
            <Text style={styles.headerTitle}>THE VAULT</Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.emerald}
              />
            }
            contentContainerStyle={styles.scrollContent}
          >
            {/* Total Earnings Card */}
            <View style={styles.earningsCard}>
              <LinearGradient
                colors={["rgba(72,187,120,0.15)", "rgba(72,187,120,0.05)"]}
                style={styles.earningsCardGradient}
              >
                <Text style={styles.earningsLabel}>TOTAL EARNINGS</Text>
                <View style={styles.earningsAmountRow}>
                  <DollarSign
                    size={32}
                    color={COLORS.emerald}
                    strokeWidth={2.5}
                  />
                  <Text style={styles.earningsAmount}>
                    {earnings.totalUserShare.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.earningsSub}>
                  <TrendingUp size={14} color={COLORS.mint300} />
                  <Text style={styles.earningsSubText}>
                    Your 60% share of ${earnings.totalEarned.toFixed(2)} total
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Data Contributed */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <HardDrive size={22} color={COLORS.emerald} />
                <Text style={styles.statValue}>
                  {earnings.totalDataGB.toFixed(1)} GB
                </Text>
                <Text style={styles.statLabel}>Data Contributed</Text>
              </View>
              <View style={styles.statCard}>
                <Clock size={22} color={COLORS.emerald} />
                <Text style={styles.statValue}>
                  {earnings.totalHours.toFixed(1)} hrs
                </Text>
                <Text style={styles.statLabel}>Time Recorded</Text>
              </View>
            </View>

            {/* Profit Split Visualization */}
            <View style={styles.splitCard}>
              <Text style={styles.splitTitle}>PROFIT SPLIT</Text>
              <View style={styles.splitBarContainer}>
                <View style={styles.splitBarUser}>
                  <Text style={styles.splitBarText}>
                    60% — ${earnings.totalUserShare.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.splitBarPlatform}>
                  <Text style={styles.splitBarTextPlatform}>
                    40% — ${earnings.totalPlatformShare.toFixed(2)}
                  </Text>
                </View>
              </View>
              <View style={styles.splitLegend}>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: COLORS.emerald },
                    ]}
                  />
                  <Text style={styles.legendText}>Your Earnings</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: COLORS.slate600 },
                    ]}
                  />
                  <Text style={styles.legendText}>Platform Fee</Text>
                </View>
              </View>
            </View>

            {/* Work History */}
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>WORK HISTORY</Text>
              <Text style={styles.historyCount}>
                {earnings.sessions.length} sessions
              </Text>
            </View>

            {earnings.sessions.map((session: Session) => (
              <View key={session.id} style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <View style={styles.historyIconBg}>
                    <Mic size={16} color={COLORS.emerald} />
                  </View>
                  <View>
                    <Text style={styles.historyType}>{session.type}</Text>
                    <Text style={styles.historyDate}>
                      {formatDate(session.startTime)}
                    </Text>
                  </View>
                </View>
                <View style={styles.historyRight}>
                  <View style={styles.historyEarnings}>
                    <Text style={styles.historyDuration}>
                      {session.durationMinutes} min
                    </Text>
                    <Text style={styles.historyAmount}>
                      ${session.userShare.toFixed(2)}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={COLORS.slate500} />
                </View>
              </View>
            ))}

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  earningsCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(72,187,120,0.2)",
  },
  earningsCardGradient: {
    padding: 24,
  },
  earningsLabel: {
    color: COLORS.emerald,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
    marginBottom: 8,
  },
  earningsAmountRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  earningsAmount: {
    color: COLORS.white,
    fontSize: 52,
    fontWeight: "800",
    letterSpacing: -2,
  },
  earningsSub: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  earningsSubText: {
    color: COLORS.mint300,
    fontSize: 13,
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 18,
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "800",
  },
  statLabel: {
    color: COLORS.slate400,
    fontSize: 12,
    fontWeight: "500",
  },
  splitCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 20,
    marginBottom: 24,
  },
  splitTitle: {
    color: COLORS.slate400,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 14,
  },
  splitBarContainer: {
    flexDirection: "row",
    height: 40,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 14,
  },
  splitBarUser: {
    flex: 6,
    backgroundColor: COLORS.emerald,
    justifyContent: "center",
    paddingLeft: 12,
  },
  splitBarPlatform: {
    flex: 4,
    backgroundColor: COLORS.slate600,
    justifyContent: "center",
    paddingLeft: 10,
  },
  splitBarText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },
  splitBarTextPlatform: {
    color: COLORS.slate300,
    fontSize: 11,
    fontWeight: "600",
  },
  splitLegend: {
    flexDirection: "row",
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: COLORS.slate400,
    fontSize: 12,
    fontWeight: "500",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  historyTitle: {
    color: COLORS.slate400,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
  historyCount: {
    color: COLORS.slate500,
    fontSize: 12,
    fontWeight: "500",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    padding: 14,
    marginBottom: 8,
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  historyIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(72,187,120,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  historyType: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  historyDate: {
    color: COLORS.slate500,
    fontSize: 12,
    marginTop: 2,
  },
  historyRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  historyEarnings: {
    alignItems: "flex-end",
  },
  historyDuration: {
    color: COLORS.slate400,
    fontSize: 12,
    fontWeight: "500",
  },
  historyAmount: {
    color: COLORS.emerald,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
});

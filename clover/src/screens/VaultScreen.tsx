import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
  TouchableOpacity,
  Alert,
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
  MicOff,
  Info,
  CircleDollarSign,
  ArrowUpRight,
  Package,
  AlertCircle,
} from "lucide-react-native";
import { getEarnings, requestPayout, getUser } from "../services/api";
import { COLORS } from "../constants/theme";
import { Earnings, Session } from "../types";

export default function VaultScreen() {
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPayoutMethod, setHasPayoutMethod] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadEarnings = useCallback(async () => {
    const data = await getEarnings();
    setEarnings(data);
    const user = await getUser();
    setHasPayoutMethod(user?.payoutMethod !== "none" && !!user?.payoutMethod);
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

  const handleRequestPayout = async () => {
    if (!earnings || earnings.pendingPayout <= 0) {
      Alert.alert("No Payout Available", "You don't have any pending earnings from sold data.");
      return;
    }
    if (!hasPayoutMethod) {
      Alert.alert(
        "Set Up Payments",
        "Please connect your Stripe account in Settings before requesting a payout.",
        [{ text: "OK" }]
      );
      return;
    }

    // Confirm before requesting
    Alert.alert(
      "Request Payout",
      `Request a payout of $${earnings.pendingPayout.toFixed(2)} to your connected Stripe account?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request Payout",
          onPress: async () => {
            try {
              const payout = await requestPayout(earnings.pendingPayout);
              Alert.alert(
                "Payout Requested",
                `Your $${payout.amount.toFixed(2)} payout has been submitted and will be processed via Stripe. You'll receive the funds in 3-7 business days.`
              );
              await loadEarnings();
            } catch (e: any) {
              Alert.alert("Payout Failed", e?.message || "Something went wrong. Please try again.");
            }
          },
        },
      ]
    );
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

  const getStatusBadge = (status: Session["dataSaleStatus"]) => {
    switch (status) {
      case "pending_upload":
        return { label: "UPLOADING", color: COLORS.yellow };
      case "uploaded":
        return { label: "PENDING SALE", color: COLORS.slate400 };
      case "listed":
        return { label: "LISTED", color: "#60A5FA" };
      case "sold":
        return { label: "SOLD", color: COLORS.emerald };
      case "paid_out":
        return { label: "PAID", color: COLORS.mint300 };
      default:
        return { label: "UNKNOWN", color: COLORS.slate500 };
    }
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
            {/* Estimated Earnings Card */}
            <View style={styles.earningsCard}>
              <LinearGradient
                colors={["rgba(72,187,120,0.15)", "rgba(72,187,120,0.05)"]}
                style={styles.earningsCardGradient}
              >
                <View style={styles.earningsLabelRow}>
                  <Text style={styles.earningsLabel}>ESTIMATED EARNINGS</Text>
                  <View style={styles.estBadge}>
                    <Text style={styles.estBadgeText}>EST.</Text>
                  </View>
                </View>
                <View style={styles.earningsAmountRow}>
                  <DollarSign
                    size={28}
                    color={COLORS.emerald}
                    strokeWidth={2.5}
                  />
                  <Text style={styles.earningsAmount}>
                    {earnings.totalEstimated.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.disclaimerRow}>
                  <Info size={12} color={COLORS.slate500} />
                  <Text style={styles.disclaimerText}>
                    Based on average market rates. Actual amount determined when data is sold.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Actual Earnings Card */}
            <View style={styles.actualCard}>
              <View style={styles.actualCardInner}>
                <Text style={styles.actualLabel}>ACTUAL EARNINGS</Text>
                <View style={styles.actualAmountRow}>
                  <DollarSign size={24} color={COLORS.white} strokeWidth={2.5} />
                  <Text style={styles.actualAmount}>
                    {earnings.totalActualEarned.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.actualSub}>
                  From sold data • 60% (narrated) / 40% (silent) of sale price
                </Text>

                {/* Payout breakdown */}
                <View style={styles.payoutGrid}>
                  <View style={styles.payoutItem}>
                    <CircleDollarSign size={16} color={COLORS.emerald} />
                    <Text style={styles.payoutItemLabel}>Your Share</Text>
                    <Text style={styles.payoutItemValue}>
                      ${earnings.totalUserPayouts.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.payoutItem}>
                    <ArrowUpRight size={16} color={COLORS.mint300} />
                    <Text style={styles.payoutItemLabel}>Paid Out</Text>
                    <Text style={styles.payoutItemValue}>
                      ${earnings.paidOut.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.payoutItem}>
                    <Package size={16} color={COLORS.yellow} />
                    <Text style={styles.payoutItemLabel}>Pending</Text>
                    <Text style={[styles.payoutItemValue, { color: COLORS.yellow }]}>
                      ${earnings.pendingPayout.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Request Payout Button */}
                {earnings.pendingPayout > 0 && (
                  <TouchableOpacity
                    style={styles.payoutButton}
                    onPress={handleRequestPayout}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[COLORS.emerald, COLORS.mint500]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.payoutButtonGradient}
                    >
                      <DollarSign size={18} color={COLORS.white} />
                      <Text style={styles.payoutButtonText}>
                        Request Payout — ${earnings.pendingPayout.toFixed(2)}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
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

            {/* Revenue Split Visualization */}
            <View style={styles.splitCard}>
              <Text style={styles.splitTitle}>REVENUE SPLIT (AFTER SALE)</Text>

              <View style={styles.splitSection}>
                <View style={styles.splitSectionHeader}>
                  <Mic size={12} color={COLORS.emerald} />
                  <Text style={styles.splitSectionLabel}>NARRATED RECORDINGS</Text>
                </View>
                <View style={styles.splitBarContainer}>
                  <View style={[styles.splitBarUser, { flex: 6 }]}>
                    <Text style={styles.splitBarText}>60% you</Text>
                  </View>
                  <View style={[styles.splitBarPlatform, { flex: 4 }]}>
                    <Text style={styles.splitBarTextPlatform}>40%</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.splitSection, { marginTop: 10 }]}>
                <View style={styles.splitSectionHeader}>
                  <MicOff size={12} color={COLORS.slate500} />
                  <Text style={[styles.splitSectionLabel, { color: COLORS.slate500 }]}>
                    SILENT RECORDINGS
                  </Text>
                </View>
                <View style={styles.splitBarContainer}>
                  <View style={[styles.splitBarUser, { flex: 4, backgroundColor: COLORS.slate500 }]}>
                    <Text style={styles.splitBarText}>40% you</Text>
                  </View>
                  <View style={[styles.splitBarPlatform, { flex: 6 }]}>
                    <Text style={styles.splitBarTextPlatform}>60%</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.splitNote, { marginTop: 12 }]}>
                <AlertCircle size={12} color={COLORS.slate500} />
                <Text style={styles.splitNoteText}>
                  Narrated recordings earn a higher split because they're more
                  valuable for AI training. Enable narration to maximize your payout.
                </Text>
              </View>
            </View>

            {/* Work History */}
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>WORK HISTORY</Text>
              <Text style={styles.historyCount}>
                {earnings.sessions.length} sessions
              </Text>
            </View>

            {earnings.sessions.map((session: Session) => {
              const badge = getStatusBadge(session.dataSaleStatus);
              return (
                <View key={session.id} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <View style={[
                      styles.historyIconBg,
                      !session.narrationEnabled && { backgroundColor: "rgba(255,255,255,0.06)" },
                    ]}>
                      {session.narrationEnabled ? (
                        <Mic size={16} color={COLORS.emerald} />
                      ) : (
                        <MicOff size={16} color={COLORS.slate500} />
                      )}
                    </View>
                    <View style={styles.historyDetails}>
                      <View style={styles.historyTypeRow}>
                        <Text style={styles.historyType}>{session.type}</Text>
                        <View style={[
                          styles.narrationBadge,
                          session.narrationEnabled
                            ? styles.narrationBadgeOn
                            : styles.narrationBadgeOff,
                        ]}>
                          <Text style={[
                            styles.narrationBadgeText,
                            { color: session.narrationEnabled ? COLORS.emerald : COLORS.slate500 },
                          ]}>
                            {session.narrationEnabled
                              ? `60/40`
                              : `40/60`}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.historyDate}>
                        {formatDate(session.startTime)}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: `${badge.color}20` }]}>
                        <View style={[styles.statusDot, { backgroundColor: badge.color }]} />
                        <Text style={[styles.statusText, { color: badge.color }]}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.historyRight}>
                    <View style={styles.historyEarnings}>
                      <Text style={styles.historyDuration}>
                        {session.durationMinutes} min
                      </Text>
                      {session.actualEarnings > 0 ? (
                        <Text style={styles.historyAmountActual}>
                          ${session.userPayout.toFixed(2)}
                        </Text>
                      ) : (
                        <Text style={styles.historyAmountEstimated}>
                          ~${session.estimatedEarnings.toFixed(2)}
                        </Text>
                      )}
                      <Text style={styles.historyEarningType}>
                        {session.actualEarnings > 0 ? "actual" : "est."}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}

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
  // Estimated Earnings
  earningsCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(72,187,120,0.2)",
  },
  earningsCardGradient: {
    padding: 20,
  },
  earningsLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  earningsLabel: {
    color: COLORS.emerald,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
  },
  estBadge: {
    backgroundColor: "rgba(246, 224, 94, 0.15)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  estBadgeText: {
    color: COLORS.yellow,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  earningsAmountRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  earningsAmount: {
    color: COLORS.white,
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -2,
  },
  disclaimerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 8,
  },
  disclaimerText: {
    color: COLORS.slate500,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  // Actual Earnings
  actualCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  actualCardInner: {
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  actualLabel: {
    color: COLORS.slate400,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
    marginBottom: 6,
  },
  actualAmountRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  actualAmount: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
  },
  actualSub: {
    color: COLORS.slate500,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  payoutGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  payoutItem: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 6,
  },
  payoutItemLabel: {
    color: COLORS.slate500,
    fontSize: 10,
    fontWeight: "600",
  },
  payoutItemValue: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
  payoutButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  payoutButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 12,
  },
  payoutButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },
  // Stats
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
  // Split
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
  splitSection: {},
  splitSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  splitSectionLabel: {
    color: COLORS.emerald,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  splitBarContainer: {
    flexDirection: "row",
    height: 32,
    borderRadius: 8,
    overflow: "hidden",
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
  splitNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  splitNoteText: {
    color: COLORS.slate500,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  // History
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
  historyDetails: {
    flex: 1,
  },
  historyTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  historyType: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  narrationBadge: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  narrationBadgeOn: {
    backgroundColor: "rgba(72,187,120,0.12)",
  },
  narrationBadgeOff: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  narrationBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  historyDate: {
    color: COLORS.slate500,
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  historyRight: {
    alignItems: "flex-end",
  },
  historyEarnings: {
    alignItems: "flex-end",
  },
  historyDuration: {
    color: COLORS.slate400,
    fontSize: 12,
    fontWeight: "500",
  },
  historyAmountActual: {
    color: COLORS.emerald,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  historyAmountEstimated: {
    color: COLORS.slate400,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  historyEarningType: {
    color: COLORS.slate500,
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1,
    marginTop: 1,
  },
});

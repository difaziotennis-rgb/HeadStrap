import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { DollarSign, TrendingUp, Info } from "lucide-react-native";
import { COLORS } from "../constants/theme";

interface EarningsMeterProps {
  amount: number;
  label?: string;
  isEstimate?: boolean;
  narrated?: boolean;
}

export default function EarningsMeter({
  amount,
  label = "SESSION EARNINGS",
  isEstimate = true,
  narrated = true,
}: EarningsMeterProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <View style={styles.header}>
        <TrendingUp size={14} color={COLORS.emerald} />
        <Text style={styles.label}>{label}</Text>
        {isEstimate && (
          <View style={styles.estimateBadge}>
            <Text style={styles.estimateText}>EST.</Text>
          </View>
        )}
      </View>
      <View style={styles.amountRow}>
        <DollarSign size={28} color={COLORS.emerald} strokeWidth={2.5} />
        <Text style={styles.amount}>{amount.toFixed(2)}</Text>
      </View>
      {isEstimate && (
        <View style={styles.disclaimerRow}>
          <Info size={11} color={COLORS.slate500} />
          <Text style={styles.disclaimerText}>
            Estimated based on avg market rates. Actual earnings are calculated
            when your data is sold.
          </Text>
        </View>
      )}
      <View style={styles.rateRow}>
        <View style={[styles.rateDot, !narrated && { backgroundColor: COLORS.slate500 }]} />
        <Text style={styles.rateText}>
          {narrated
            ? "~$0.28/min est. • 60/40 split after sale"
            : "~$0.12/min est. • 40/60 split (no narration)"}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(72, 187, 120, 0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(72, 187, 120, 0.2)",
    padding: 16,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  label: {
    color: COLORS.emerald,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
  estimateBadge: {
    backgroundColor: "rgba(246, 224, 94, 0.15)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  estimateText: {
    color: COLORS.yellow,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  amount: {
    color: COLORS.white,
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: -1,
  },
  disclaimerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginTop: 6,
    paddingRight: 8,
  },
  disclaimerText: {
    color: COLORS.slate500,
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },
  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  rateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.emerald,
  },
  rateText: {
    color: COLORS.slate400,
    fontSize: 12,
    fontWeight: "500",
  },
});

import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { DollarSign, TrendingUp } from "lucide-react-native";
import { COLORS } from "../constants/theme";

interface EarningsMeterProps {
  amount: number;
  label?: string;
}

export default function EarningsMeter({
  amount,
  label = "SESSION EARNINGS",
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
      </View>
      <View style={styles.amountRow}>
        <DollarSign size={28} color={COLORS.emerald} strokeWidth={2.5} />
        <Text style={styles.amount}>{amount.toFixed(2)}</Text>
      </View>
      <View style={styles.rateRow}>
        <View style={styles.rateDot} />
        <Text style={styles.rateText}>$0.28/min • 60% to you</Text>
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
  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
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

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../constants/theme";
import { StoplightStatus } from "../types";

interface StoplightBarProps {
  status: StoplightStatus;
}

const STATUS_CONFIG = {
  green: {
    label: "RECORDING • EARNING",
    color: COLORS.green,
    bgColor: "rgba(72, 187, 120, 0.15)",
  },
  yellow: {
    label: "PAUSED • LOW LIGHT",
    color: COLORS.yellow,
    bgColor: "rgba(246, 224, 94, 0.15)",
  },
  red: {
    label: "UPLOAD ERROR",
    color: COLORS.red,
    bgColor: "rgba(252, 129, 129, 0.15)",
  },
};

export default function StoplightBar({ status }: StoplightBarProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View style={[styles.container, { backgroundColor: config.bgColor }]}>
      <View style={styles.lights}>
        {(["red", "yellow", "green"] as StoplightStatus[]).map((s) => (
          <View
            key={s}
            style={[
              styles.light,
              {
                backgroundColor:
                  s === status ? STATUS_CONFIG[s].color : "#2D3748",
                shadowColor: s === status ? STATUS_CONFIG[s].color : "transparent",
                shadowOpacity: s === status ? 0.8 : 0,
                shadowRadius: s === status ? 8 : 0,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 12,
  },
  lights: {
    flexDirection: "row",
    gap: 6,
  },
  light: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
});

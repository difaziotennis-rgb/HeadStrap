import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { Clover } from "lucide-react-native";
import { COLORS } from "../constants/theme";

interface CloverLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const SIZES = {
  sm: { icon: 28, text: 18, glow: 8 },
  md: { icon: 48, text: 28, glow: 16 },
  lg: { icon: 72, text: 42, glow: 24 },
};

export default function CloverLogo({
  size = "md",
  showText = true,
}: CloverLogoProps) {
  const pulseAnim = useRef(new Animated.Value(0.6)).current;
  const dims = SIZES[size];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.glowWrapper,
          {
            opacity: pulseAnim,
            shadowRadius: dims.glow,
          },
        ]}
      >
        <View
          style={[
            styles.iconCircle,
            {
              width: dims.icon * 1.6,
              height: dims.icon * 1.6,
              borderRadius: dims.icon * 0.8,
            },
          ]}
        >
          <Clover
            size={dims.icon}
            color={COLORS.mint50}
            strokeWidth={1.5}
          />
        </View>
      </Animated.View>
      {showText && (
        <Text
          style={[
            styles.logoText,
            { fontSize: dims.text, marginTop: dims.glow },
          ]}
        >
          CLOVER
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  glowWrapper: {
    shadowColor: COLORS.emerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  iconCircle: {
    backgroundColor: COLORS.emerald,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: COLORS.emerald,
    fontWeight: "800",
    letterSpacing: 8,
  },
});

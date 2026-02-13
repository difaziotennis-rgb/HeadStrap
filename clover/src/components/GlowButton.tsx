import React, { useEffect, useRef } from "react";
import {
  TouchableOpacity,
  Text,
  Animated,
  StyleSheet,
  View,
} from "react-native";
import { COLORS } from "../constants/theme";

interface GlowButtonProps {
  label: string;
  sublabel?: string;
  onPress: () => void;
  active?: boolean;
  size?: number;
}

export default function GlowButton({
  label,
  sublabel,
  onPress,
  active = false,
  size = 220,
}: GlowButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.4,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0.4);
    }
  }, [active]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.outerRing,
          {
            width: size + 30,
            height: size + 30,
            borderRadius: (size + 30) / 2,
            opacity: glowAnim,
          },
        ]}
      >
        <View
          style={[
            styles.middleRing,
            {
              width: size + 15,
              height: size + 15,
              borderRadius: (size + 15) / 2,
            },
          ]}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: pulseAnim }],
          },
          active ? styles.buttonActive : styles.buttonInactive,
        ]}
      >
        <Text style={[styles.label, { fontSize: size * 0.085 }]}>{label}</Text>
        {sublabel && (
          <Text style={[styles.sublabel, { fontSize: size * 0.055 }]}>
            {sublabel}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outerRing: {
    position: "absolute",
    alignSelf: "center",
    borderWidth: 2,
    borderColor: COLORS.emerald,
    top: -15,
    left: -15,
  },
  middleRing: {
    position: "absolute",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: COLORS.mint300,
    top: 6.5,
    left: 6.5,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.emerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 30,
    elevation: 20,
  },
  buttonActive: {
    backgroundColor: COLORS.emerald,
  },
  buttonInactive: {
    backgroundColor: COLORS.darkSlate,
    borderWidth: 3,
    borderColor: COLORS.emerald,
  },
  label: {
    color: COLORS.white,
    fontWeight: "800",
    letterSpacing: 2,
    textAlign: "center",
  },
  sublabel: {
    color: COLORS.mint200,
    fontWeight: "500",
    marginTop: 4,
    letterSpacing: 1,
  },
});

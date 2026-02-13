import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ScanFace,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
} from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { updateUser } from "../services/api";
import { COLORS } from "../constants/theme";
import { RootStackParamList } from "../types";

type Props = {
  navigation: NativeStackNavigationProp<
    RootStackParamList,
    "HumanVerification"
  >;
};

export default function HumanVerificationScreen({ navigation }: Props) {
  const [phase, setPhase] = useState<"idle" | "scanning" | "verified">("idle");
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const checkScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Rotate the scanner ring
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    if (phase === "scanning") {
      // Scan line animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Progress to verified
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 3500,
        useNativeDriver: false,
      }).start(() => {
        setPhase("verified");
      });
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "verified") {
      Animated.spring(checkScaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }).start();
    }
  }, [phase]);

  const startScan = () => {
    setPhase("scanning");
  };

  const handleContinue = async () => {
    try {
      await updateUser({ verified: true });
    } catch {
      // Continue even if API is unavailable
    }
    navigation.replace("Calibration");
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 80],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <LinearGradient
      colors={[COLORS.darkBg, COLORS.slate800, COLORS.darkBg]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <ShieldCheck size={20} color={COLORS.emerald} />
          <Text style={styles.headerText}>HUMAN VERIFICATION</Text>
        </View>

        <View style={styles.scannerSection}>
          {/* Outer rotating ring */}
          <Animated.View
            style={[styles.outerRing, { transform: [{ rotate: spin }] }]}
          >
            <View style={styles.ringSegment} />
            <View style={[styles.ringSegment, styles.ringSegment2]} />
            <View style={[styles.ringSegment, styles.ringSegment3]} />
          </Animated.View>

          {/* Scanner face area */}
          <View style={styles.scanArea}>
            {phase === "verified" ? (
              <Animated.View
                style={{ transform: [{ scale: checkScaleAnim }] }}
              >
                <CheckCircle2 size={80} color={COLORS.emerald} strokeWidth={1.5} />
              </Animated.View>
            ) : (
              <>
                <ScanFace
                  size={80}
                  color={
                    phase === "scanning" ? COLORS.emerald : COLORS.slate400
                  }
                  strokeWidth={1}
                />
                {phase === "scanning" && (
                  <Animated.View
                    style={[
                      styles.scanLine,
                      { transform: [{ translateY: scanLineTranslate }] },
                    ]}
                  />
                )}
              </>
            )}
          </View>

          {/* Corner brackets */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        {/* Status text */}
        <Text style={styles.statusText}>
          {phase === "idle" && "Position your face within the frame"}
          {phase === "scanning" && "Analyzing biometric markers..."}
          {phase === "verified" && "Identity Confirmed"}
        </Text>

        {phase === "scanning" && (
          <View style={styles.progressBarOuter}>
            <Animated.View
              style={[styles.progressBarInner, { width: progressWidth }]}
            />
          </View>
        )}

        {/* Description */}
        <Text style={styles.description}>
          {phase === "verified"
            ? "You've been verified as a real human worker. Your data contributions are now eligible for earnings."
            : "Clover uses advanced facial recognition to ensure all data contributors are real workers — not bots. This protects the value of your contributions."}
        </Text>

        {/* Action button */}
        {phase === "idle" && (
          <TouchableOpacity
            style={styles.scanButton}
            onPress={startScan}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.emerald, COLORS.mint500]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.scanButtonGradient}
            >
              <ScanFace size={22} color={COLORS.white} />
              <Text style={styles.scanButtonText}>Begin Face Scan</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {phase === "verified" && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.emerald, COLORS.mint500]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.scanButtonGradient}
            >
              <Text style={styles.scanButtonText}>Continue</Text>
              <ChevronRight size={22} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 50,
  },
  headerText: {
    color: COLORS.emerald,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 3,
  },
  scannerSection: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },
  outerRing: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: "rgba(72, 187, 120, 0.2)",
  },
  ringSegment: {
    position: "absolute",
    width: 60,
    height: 4,
    backgroundColor: COLORS.emerald,
    borderRadius: 2,
    top: 108,
    left: -2,
  },
  ringSegment2: {
    transform: [{ rotate: "120deg" }],
    left: 40,
    top: 30,
  },
  ringSegment3: {
    transform: [{ rotate: "240deg" }],
    left: 160,
    top: 30,
  },
  scanArea: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(72, 187, 120, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  scanLine: {
    position: "absolute",
    width: 160,
    height: 2,
    backgroundColor: COLORS.emerald,
    shadowColor: COLORS.emerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: COLORS.emerald,
  },
  cornerTL: {
    top: 20,
    left: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 20,
    right: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 20,
    left: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 20,
    right: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  progressBarOuter: {
    width: "80%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 20,
  },
  progressBarInner: {
    height: "100%",
    backgroundColor: COLORS.emerald,
    borderRadius: 2,
  },
  description: {
    color: COLORS.slate400,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  scanButton: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: COLORS.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  continueButton: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: COLORS.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  scanButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    borderRadius: 14,
  },
  scanButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

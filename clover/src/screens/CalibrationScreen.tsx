import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Smartphone,
  ChevronRight,
  Crosshair,
  Eye,
  CheckCircle2,
} from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { updateUser } from "../services/api";
import { COLORS } from "../constants/theme";
import { RootStackParamList } from "../types";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Calibration">;
};

export default function CalibrationScreen({ navigation }: Props) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 8,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleContinue = async () => {
    await updateUser({ calibrated: true });
    navigation.replace("MainTabs");
  };

  return (
    <LinearGradient
      colors={[COLORS.darkBg, COLORS.slate800, COLORS.darkBg]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.emerald, COLORS.mint500]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>I'm Ready</Text>
              <ChevronRight size={22} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.header}>
            <Crosshair size={20} color={COLORS.emerald} />
            <Text style={styles.headerText}>CAMERA CALIBRATION</Text>
          </View>

          {/* Illustration: Phone on forehead */}
          <Animated.View
            style={[
              styles.illustration,
              { transform: [{ translateY: floatAnim }] },
            ]}
          >
            {/* Head silhouette */}
            <View style={styles.headOuter}>
              <View style={styles.head}>
                <View style={styles.face}>
                  <View style={styles.eyeRow}>
                    <Eye size={18} color={COLORS.slate400} />
                    <Eye size={18} color={COLORS.slate400} />
                  </View>
                </View>
              </View>
              {/* Phone on forehead */}
              <Animated.View
                style={[
                  styles.phoneOnHead,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <View style={styles.phoneBody}>
                  <Smartphone size={32} color={COLORS.emerald} strokeWidth={1.5} />
                  <View style={styles.phoneGlow} />
                </View>
                <View style={styles.phoneCameraIndicator}>
                  <View style={styles.cameraDot} />
                </View>
              </Animated.View>
              {/* Strap lines */}
              <View style={[styles.strap, styles.strapLeft]} />
              <View style={[styles.strap, styles.strapRight]} />
            </View>
          </Animated.View>

          <Text style={styles.title}>Secure Your Device</Text>
          <Text style={styles.subtitle}>
            Attach your phone to a headband or helmet mount with the camera facing
            forward. This ensures hands-free, POV recording of your professional
            work.
          </Text>

          {/* Checklist */}
          <View style={styles.checklist}>
            {[
              "Camera faces forward, not down",
              "Phone is secure and won't shift",
              "Field of view covers your workspace",
              "Good lighting in the environment",
            ].map((item, i) => (
              <View key={i} style={styles.checkItem}>
                <CheckCircle2 size={18} color={COLORS.emerald} />
                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  headerText: {
    color: COLORS.emerald,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 3,
  },
  illustration: {
    alignItems: "center",
    marginBottom: 20,
  },
  headOuter: {
    alignItems: "center",
    justifyContent: "center",
    width: 140,
    height: 170,
  },
  head: {
    width: 120,
    height: 150,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  face: {
    alignItems: "center",
    marginTop: 20,
  },
  eyeRow: {
    flexDirection: "row",
    gap: 24,
  },
  phoneOnHead: {
    position: "absolute",
    top: -5,
    alignItems: "center",
  },
  phoneBody: {
    width: 52,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.slate800,
    borderWidth: 2,
    borderColor: COLORS.emerald,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  phoneGlow: {
    position: "absolute",
    width: 52,
    height: 40,
    backgroundColor: COLORS.emerald,
    opacity: 0.1,
  },
  phoneCameraIndicator: {
    marginTop: 2,
  },
  cameraDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.emerald,
    shadowColor: COLORS.emerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  strap: {
    position: "absolute",
    height: 3,
    backgroundColor: COLORS.slate500,
    borderRadius: 2,
    top: 18,
  },
  strapLeft: {
    width: 40,
    left: -10,
    transform: [{ rotate: "-15deg" }],
  },
  strapRight: {
    width: 40,
    right: -10,
    transform: [{ rotate: "15deg" }],
  },
  title: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    color: COLORS.slate400,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 16,
  },
  checklist: {
    width: "100%",
    gap: 10,
    marginBottom: 20,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(72, 187, 120, 0.06)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(72, 187, 120, 0.1)",
  },
  checkText: {
    color: COLORS.slate300,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
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
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    borderRadius: 14,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

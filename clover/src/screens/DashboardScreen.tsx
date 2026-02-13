import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Mic,
  MicOff,
  Clover,
  Zap,
  Clock,
} from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import GlowButton from "../components/GlowButton";
import EarningsMeter from "../components/EarningsMeter";
import CloverLogo from "../components/CloverLogo";
import {
  startSession,
  endSession,
  updateCurrentSession,
  getCurrentSession,
} from "../services/mockBackend";
import { COLORS } from "../constants/theme";
import { RootStackParamList, Session } from "../types";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export default function DashboardScreen({ navigation }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [narrationEnabled, setNarrationEnabled] = useState(true);
  const [sessionEarnings, setSessionEarnings] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Check for existing session
    getCurrentSession().then((session) => {
      if (session && session.status === "recording") {
        setCurrentSession(session);
        setIsRecording(true);
        setSessionEarnings(session.estimatedEarnings);
      }
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    const session = await startSession(
      "Field Recording",
      narrationEnabled
    );
    setCurrentSession(session);
    setIsRecording(true);
    setElapsedSeconds(0);
    setSessionEarnings(0);

    timerRef.current = setInterval(async () => {
      setElapsedSeconds((prev) => {
        const newElapsed = prev + 1;
        const minutes = newElapsed / 60;
        updateCurrentSession(minutes).then((updated) => {
          if (updated) {
            setSessionEarnings(updated.estimatedEarnings);
          }
        });
        return newElapsed;
      });
    }, 1000);

    // Navigate to Recorder
    navigation.navigate("Recorder");
  }, [narrationEnabled, navigation]);

  const stopRecording = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    await endSession();
    setIsRecording(false);
    setCurrentSession(null);
  }, []);

  const handleButtonPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <LinearGradient
      colors={[COLORS.darkBg, "#0D1B0F", COLORS.darkBg]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <CloverLogo size="sm" showText={false} />
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>CLOVER</Text>
              <View style={styles.statusBadge}>
                <Zap size={10} color={COLORS.emerald} />
                <Text style={styles.statusText}>
                  {isRecording ? "LIVE" : "READY"}
                </Text>
              </View>
            </View>
            <View style={styles.headerRight} />
          </View>

          {/* Earnings Meter */}
          <EarningsMeter
            amount={sessionEarnings}
            label={isRecording ? "LIVE ESTIMATE" : "ESTIMATED EARNINGS"}
            isEstimate={true}
          />

          {/* Timer */}
          {isRecording && (
            <View style={styles.timerRow}>
              <Clock size={16} color={COLORS.slate400} />
              <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
            </View>
          )}

          {/* Main Button */}
          <View style={styles.buttonSection}>
            <GlowButton
              label={isRecording ? "STOP" : "START\nRECORDING"}
              sublabel={isRecording ? "Tap to end session" : "Tap to begin"}
              onPress={handleButtonPress}
              active={isRecording}
              size={200}
            />
          </View>

          {/* Narration Toggle */}
          <View style={styles.toggleSection}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                {narrationEnabled ? (
                  <Mic size={20} color={COLORS.emerald} />
                ) : (
                  <MicOff size={20} color={COLORS.slate500} />
                )}
                <View>
                  <Text style={styles.toggleLabel}>Narration Mode</Text>
                  <Text style={styles.toggleDesc}>
                    {narrationEnabled
                      ? "Audio narration will be captured"
                      : "Silent recording mode"}
                  </Text>
                </View>
              </View>
              <Switch
                value={narrationEnabled}
                onValueChange={setNarrationEnabled}
                trackColor={{
                  false: COLORS.slate600,
                  true: "rgba(72, 187, 120, 0.4)",
                }}
                thumbColor={narrationEnabled ? COLORS.emerald : COLORS.slate400}
                disabled={isRecording}
              />
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>~$0.28</Text>
              <Text style={styles.statLabel}>est/min</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>60%</Text>
              <Text style={styles.statLabel}>after sale</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>HD</Text>
              <Text style={styles.statLabel}>quality</Text>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 4,
  },
  headerRight: {
    width: 45,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(72, 187, 120, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    color: COLORS.emerald,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  timerText: {
    color: COLORS.slate300,
    fontSize: 24,
    fontWeight: "300",
    fontVariant: ["tabular-nums"],
    letterSpacing: 4,
  },
  buttonSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleSection: {
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toggleLabel: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "600",
  },
  toggleDesc: {
    color: COLORS.slate500,
    fontSize: 12,
    marginTop: 2,
  },
  quickStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingVertical: 16,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    color: COLORS.emerald,
    fontSize: 18,
    fontWeight: "800",
  },
  statLabel: {
    color: COLORS.slate500,
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});

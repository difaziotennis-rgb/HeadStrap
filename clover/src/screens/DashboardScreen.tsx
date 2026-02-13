import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Animated,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Mic,
  MicOff,
  Clover,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
  Lightbulb,
  Volume2,
} from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import GlowButton from "../components/GlowButton";
import EarningsMeter from "../components/EarningsMeter";
import CloverLogo from "../components/CloverLogo";
import {
  startSession,
  endSession,
  updateCurrentSession,
  getCurrentSession,
} from "../services/api";
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
  const [showTips, setShowTips] = useState(false);
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

  // When screen regains focus (e.g. returning from Recorder), sync state
  useFocusEffect(
    useCallback(() => {
      getCurrentSession().then((session) => {
        if (!session || session.status !== "recording") {
          // Recording was stopped elsewhere (e.g. from RecorderScreen)
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsRecording(false);
          setCurrentSession(null);
          setElapsedSeconds(0);
          setSessionEarnings(0);
        }
      });
    }, [])
  );

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
        <Animated.View style={[styles.contentWrapper, { opacity: fadeAnim }]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
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
            narrated={narrationEnabled}
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
                      : "Silent recording — lower payout"}
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

            {/* Rate comparison */}
            <View style={styles.rateCompare}>
              <View style={[styles.rateBox, narrationEnabled && styles.rateBoxActive]}>
                <View style={styles.rateBoxHeader}>
                  <Mic size={13} color={narrationEnabled ? COLORS.emerald : COLORS.slate500} />
                  <Text style={[styles.rateBoxTitle, narrationEnabled && styles.rateBoxTitleActive]}>
                    NARRATED
                  </Text>
                  {narrationEnabled && (
                    <View style={styles.activeDot} />
                  )}
                </View>
                <Text style={[styles.rateBoxAmount, narrationEnabled && styles.rateBoxAmountActive]}>
                  ~$0.28/min
                </Text>
                <Text style={styles.rateBoxSplit}>60% your split</Text>
              </View>
              <View style={[styles.rateBox, !narrationEnabled && styles.rateBoxDimmed]}>
                <View style={styles.rateBoxHeader}>
                  <MicOff size={13} color={COLORS.slate500} />
                  <Text style={styles.rateBoxTitle}>SILENT</Text>
                  {!narrationEnabled && (
                    <View style={styles.activeDotDim} />
                  )}
                </View>
                <Text style={[styles.rateBoxAmount, !narrationEnabled && { color: COLORS.slate400 }]}>
                  ~$0.12/min
                </Text>
                <Text style={styles.rateBoxSplit}>40% your split</Text>
              </View>
            </View>

            {/* Tips toggle */}
            <TouchableOpacity
              style={styles.tipsToggle}
              onPress={() => setShowTips(!showTips)}
              activeOpacity={0.7}
            >
              <Lightbulb size={14} color={COLORS.yellow} />
              <Text style={styles.tipsToggleText}>
                How to narrate for maximum earnings
              </Text>
              {showTips ? (
                <ChevronUp size={16} color={COLORS.slate400} />
              ) : (
                <ChevronDown size={16} color={COLORS.slate400} />
              )}
            </TouchableOpacity>

            {showTips && (
              <View style={styles.tipsCard}>
                <View style={styles.tipItem}>
                  <View style={styles.tipNumber}>
                    <Text style={styles.tipNumberText}>1</Text>
                  </View>
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>Describe what you see</Text>
                    <Text style={styles.tipDesc}>
                      "I'm looking at a copper pipe joint that has corroded. You can see
                      the green patina forming around the solder..."
                    </Text>
                  </View>
                </View>

                <View style={styles.tipItem}>
                  <View style={styles.tipNumber}>
                    <Text style={styles.tipNumberText}>2</Text>
                  </View>
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>Explain your process</Text>
                    <Text style={styles.tipDesc}>
                      "First I'm going to shut off the water main, then cut the pipe
                      below the joint with a tubing cutter..."
                    </Text>
                  </View>
                </View>

                <View style={styles.tipItem}>
                  <View style={styles.tipNumber}>
                    <Text style={styles.tipNumberText}>3</Text>
                  </View>
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>Call out tools & materials</Text>
                    <Text style={styles.tipDesc}>
                      "I'm using a 3/4-inch SharkBite fitting here because it doesn't
                      require soldering in a tight space..."
                    </Text>
                  </View>
                </View>

                <View style={styles.tipItem}>
                  <View style={styles.tipNumber}>
                    <Text style={styles.tipNumberText}>4</Text>
                  </View>
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>Share pro tips & warnings</Text>
                    <Text style={styles.tipDesc}>
                      "Be careful not to overtighten this — you'll strip the threads.
                      Hand-tight plus a quarter turn is all you need."
                    </Text>
                  </View>
                </View>

                <View style={styles.tipItem}>
                  <View style={styles.tipNumber}>
                    <Star size={12} color={COLORS.yellow} />
                  </View>
                  <View style={styles.tipContent}>
                    <Text style={[styles.tipTitle, { color: COLORS.yellow }]}>
                      Bonus: Speak naturally
                    </Text>
                    <Text style={styles.tipDesc}>
                      Don't rehearse. Natural, conversational narration is the most
                      valuable for training AI models. Just talk like you're teaching
                      an apprentice.
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {narrationEnabled ? "~$0.28" : "~$0.12"}
              </Text>
              <Text style={styles.statLabel}>est/min</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {narrationEnabled ? "60%" : "40%"}
              </Text>
              <Text style={styles.statLabel}>your split</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>HD</Text>
              <Text style={styles.statLabel}>quality</Text>
            </View>
          </View>
          <View style={{ height: 20 }} />
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  contentWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
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
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  toggleSection: {
    marginBottom: 14,
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
  rateCompare: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  rateBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 10,
  },
  rateBoxActive: {
    borderColor: "rgba(72,187,120,0.3)",
    backgroundColor: "rgba(72,187,120,0.06)",
  },
  rateBoxDimmed: {
    borderColor: "rgba(255,255,255,0.04)",
    opacity: 0.7,
  },
  rateBoxHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  rateBoxTitle: {
    color: COLORS.slate500,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  rateBoxTitleActive: {
    color: COLORS.emerald,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.emerald,
  },
  activeDotDim: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.slate500,
  },
  rateBoxAmount: {
    color: COLORS.slate400,
    fontSize: 16,
    fontWeight: "800",
  },
  rateBoxAmountActive: {
    color: COLORS.white,
  },
  rateBoxSplit: {
    color: COLORS.slate500,
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
  },
  tipsToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tipsToggleText: {
    color: COLORS.slate400,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  tipsCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 14,
    gap: 14,
    marginTop: 4,
  },
  tipItem: {
    flexDirection: "row",
    gap: 10,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(72,187,120,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  tipNumberText: {
    color: COLORS.emerald,
    fontSize: 12,
    fontWeight: "800",
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 3,
  },
  tipDesc: {
    color: COLORS.slate500,
    fontSize: 11,
    lineHeight: 16,
    fontStyle: "italic",
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

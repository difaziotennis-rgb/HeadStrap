import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  X,
  Pause,
  Play,
  Mic,
  SwitchCamera,
} from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import StoplightBar from "../components/StoplightBar";
import AudioWaveform from "../components/AudioWaveform";
import {
  updateCurrentSession,
  endSession,
  uploadRecording,
} from "../services/api";
import { COLORS } from "../constants/theme";
import { RootStackParamList, StoplightStatus } from "../types";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Recorder">;
};

// ─── Web Camera + Recording Component ──────────────
// Uses getUserMedia for preview and MediaRecorder to capture video+audio

function WebCamera({
  facingMode,
  style,
  onStreamReady,
}: {
  facingMode: "user" | "environment";
  style?: any;
  onStreamReady?: (stream: MediaStream) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true, // Capture audio for narration
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        onStreamReady?.(stream);
      } catch (e) {
        console.log("Camera access denied or unavailable:", e);
      }
    }

    if (Platform.OS === "web") {
      startCamera();
    }

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode]);

  if (Platform.OS !== "web") {
    return <View style={[style, { backgroundColor: "#000" }]} />;
  }

  return (
    <video
      ref={videoRef as any}
      autoPlay
      playsInline
      muted
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        ...(facingMode === "user" ? { transform: "scaleX(-1)" } : {}),
      }}
    />
  );
}

export default function RecorderScreen({ navigation }: Props) {
  const [isPaused, setIsPaused] = useState(false);
  const [stoplightStatus, setStoplightStatus] =
    useState<StoplightStatus>("green");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [dataMB, setDataMB] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [isSaving, setIsSaving] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordDotAnim = useRef(new Animated.Value(1)).current;

  // MediaRecorder refs (web only)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Record dot blink
    Animated.loop(
      Animated.sequence([
        Animated.timing(recordDotAnim, {
          toValue: 0.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(recordDotAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopMediaRecorder();
    };
  }, []);

  // ─── MediaRecorder helpers ───────────────────────

  const handleStreamReady = useCallback((stream: MediaStream) => {
    streamRef.current = stream;
    startMediaRecorder(stream);
  }, []);

  const startMediaRecorder = (stream: MediaStream) => {
    if (Platform.OS !== "web") return;

    try {
      recordedChunksRef.current = [];

      // Pick the best available codec
      const mimeType = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4",
      ].find((type) => {
        try {
          return MediaRecorder.isTypeSupported(type);
        } catch {
          return false;
        }
      }) || "";

      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
        videoBitsPerSecond: 2_500_000, // 2.5 Mbps for good quality
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.start(1000); // Collect data in 1-second chunks
      mediaRecorderRef.current = recorder;
      console.log("[Recorder] MediaRecorder started:", mimeType);
    } catch (err) {
      console.error("[Recorder] Failed to start MediaRecorder:", err);
    }
  };

  const stopMediaRecorder = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const chunks = recordedChunksRef.current;
        if (chunks.length === 0) {
          resolve(null);
          return;
        }
        const mimeType = recorder.mimeType || "video/webm";
        const blob = new Blob(chunks, { type: mimeType });
        recordedChunksRef.current = [];
        console.log(`[Recorder] Recording stopped: ${(blob.size / 1024 / 1024).toFixed(1)} MB`);
        resolve(blob);
      };

      recorder.stop();
    });
  };

  const pauseMediaRecorder = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.pause();
    }
  };

  const resumeMediaRecorder = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "paused") {
      recorder.resume();
    }
  };

  // ─── Timer ──────────────────────────────────────

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const newElapsed = prev + 1;
        const minutes = newElapsed / 60;
        updateCurrentSession(minutes).then((session) => {
          if (session) {
            setEarnings(session.estimatedEarnings);
            setDataMB(session.dataSizeMB);
          }
        }).catch(() => {});
        return newElapsed;
      });
    }, 1000);
  };

  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      setStoplightStatus("green");
      resumeMediaRecorder();
      startTimer();
    } else {
      setIsPaused(true);
      setStoplightStatus("yellow");
      pauseMediaRecorder();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleStop = useCallback(async () => {
    if (isSaving) return; // Prevent double-tap
    setIsSaving(true);
    setStoplightStatus("yellow");

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop recording and get the blob
    const recordingBlob = await stopMediaRecorder();

    // Stop the camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // End the session on the backend
    try {
      const session = await endSession();

      // Upload the recording if we have one
      if (recordingBlob && session) {
        try {
          await uploadRecording(session.id, recordingBlob);
          console.log(`[Recorder] Uploaded ${(recordingBlob.size / 1024 / 1024).toFixed(1)} MB for session ${session.id}`);
        } catch (uploadErr) {
          console.error("[Recorder] Upload failed (will retry later):", uploadErr);
          // In production, queue for retry. For now, the session is saved.
        }
      }
    } catch {
      // API unavailable — recording is lost but UX continues
    }

    navigation.goBack();
  }, [navigation, isSaving]);

  const flipCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      {/* Live camera feed + recording */}
      <WebCamera
        facingMode={facingMode}
        style={styles.cameraBackground}
        onStreamReady={handleStreamReady}
      />

      {/* Grid overlay on top of camera */}
      <View style={styles.gridOverlay}>
        <View style={[styles.gridLine, styles.gridH1]} />
        <View style={[styles.gridLine, styles.gridH2]} />
        <View style={[styles.gridLine, styles.gridV1]} />
        <View style={[styles.gridLine, styles.gridV2]} />
      </View>

      {/* Corner brackets */}
      <View style={[styles.bracket, styles.bracketTL]} />
      <View style={[styles.bracket, styles.bracketTR]} />
      <View style={[styles.bracket, styles.bracketBL]} />
      <View style={[styles.bracket, styles.bracketBR]} />

      {/* Center crosshair */}
      <View style={styles.crosshair}>
        <View style={styles.crosshairH} />
        <View style={styles.crosshairV} />
        <View style={styles.crosshairDot} />
      </View>

      {/* Top overlay */}
      <SafeAreaView style={styles.topOverlay}>
        <View style={styles.topBar}>
          <StoplightBar status={stoplightStatus} />
        </View>

        {/* Recording indicator */}
        <View style={styles.recordingRow}>
          <Animated.View
            style={[styles.recordDot, { opacity: recordDotAnim }]}
          />
          <Text style={styles.recordText}>
            {isSaving ? "SAVING..." : isPaused ? "PAUSED" : "REC"}
          </Text>
          <Text style={styles.timeText}>{formatTime(elapsedSeconds)}</Text>
        </View>

        {/* Live stats */}
        <View style={styles.liveStats}>
          <View style={styles.liveStat}>
            <Text style={styles.liveStatLabel}>EARNED</Text>
            <Text style={styles.liveStatValue}>${earnings.toFixed(2)}</Text>
          </View>
          <View style={styles.liveStatDivider} />
          <View style={styles.liveStat}>
            <Text style={styles.liveStatLabel}>DATA</Text>
            <Text style={styles.liveStatValue}>
              {dataMB > 1024
                ? `${(dataMB / 1024).toFixed(1)} GB`
                : `${dataMB.toFixed(0)} MB`}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom overlay */}
      <View style={styles.bottomOverlay}>
        {/* Audio waveform */}
        <View style={styles.waveformContainer}>
          <View style={styles.waveformHeader}>
            <Mic size={14} color={COLORS.emerald} />
            <Text style={styles.waveformLabel}>NARRATION</Text>
          </View>
          <AudioWaveform active={!isPaused && !isSaving} height={50} barCount={40} />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleStop}
            activeOpacity={0.7}
            disabled={isSaving}
          >
            <View style={[styles.stopButton, isSaving && { opacity: 0.5 }]}>
              <X size={24} color={COLORS.red} />
            </View>
            <Text style={styles.controlLabel}>
              {isSaving ? "Saving..." : "Stop"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={togglePause}
            activeOpacity={0.7}
            disabled={isSaving}
          >
            <View
              style={[
                styles.pauseButton,
                isPaused && styles.pauseButtonActive,
                isSaving && { opacity: 0.5 },
              ]}
            >
              {isPaused ? (
                <Play size={28} color={COLORS.emerald} />
              ) : (
                <Pause size={28} color={COLORS.white} />
              )}
            </View>
            <Text style={styles.controlLabel}>
              {isPaused ? "Resume" : "Pause"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={flipCamera}
            activeOpacity={0.7}
            disabled={isSaving}
          >
            <View style={[styles.cameraButton, isSaving && { opacity: 0.5 }]}>
              <SwitchCamera size={24} color={COLORS.slate300} />
            </View>
            <Text style={styles.controlLabel}>Flip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: "absolute",
    backgroundColor: "rgba(72, 187, 120, 0.07)",
  },
  gridH1: {
    width: "100%",
    height: 1,
    top: "33%",
  },
  gridH2: {
    width: "100%",
    height: 1,
    top: "66%",
  },
  gridV1: {
    width: 1,
    height: "100%",
    left: "33%",
  },
  gridV2: {
    width: 1,
    height: "100%",
    left: "66%",
  },
  bracket: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: COLORS.emerald,
  },
  bracketTL: {
    top: 100,
    left: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  bracketTR: {
    top: 100,
    right: 20,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bracketBL: {
    bottom: 200,
    left: 20,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bracketBR: {
    bottom: 200,
    right: 20,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  crosshair: {
    position: "absolute",
    top: "45%",
    alignSelf: "center",
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  crosshairH: {
    position: "absolute",
    width: 30,
    height: 1,
    backgroundColor: "rgba(72, 187, 120, 0.4)",
  },
  crosshairV: {
    position: "absolute",
    width: 1,
    height: 30,
    backgroundColor: "rgba(72, 187, 120, 0.4)",
  },
  crosshairDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.emerald,
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  topBar: {
    marginTop: 8,
  },
  recordingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    alignSelf: "center",
  },
  recordDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.red,
  },
  recordText: {
    color: COLORS.red,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
  },
  timeText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    letterSpacing: 2,
    marginLeft: 8,
  },
  liveStats: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 12,
    gap: 16,
  },
  liveStat: {
    alignItems: "center",
  },
  liveStatLabel: {
    color: COLORS.slate400,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
  },
  liveStatValue: {
    color: COLORS.emerald,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
  },
  liveStatDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  waveformContainer: {
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  waveformHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  waveformLabel: {
    color: COLORS.emerald,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 36,
  },
  controlButton: {
    alignItems: "center",
    gap: 8,
  },
  stopButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(252, 129, 129, 0.15)",
    borderWidth: 2,
    borderColor: "rgba(252, 129, 129, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  pauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  pauseButtonActive: {
    borderColor: COLORS.emerald,
    backgroundColor: "rgba(72, 187, 120, 0.15)",
  },
  cameraButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlLabel: {
    color: COLORS.slate400,
    fontSize: 11,
    fontWeight: "600",
  },
});

import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { COLORS } from "../constants/theme";

interface AudioWaveformProps {
  active: boolean;
  barCount?: number;
  height?: number;
}

export default function AudioWaveform({
  active,
  barCount = 32,
  height = 60,
}: AudioWaveformProps) {
  const anims = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.15))
  ).current;

  useEffect(() => {
    if (active) {
      const animations = anims.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: Math.random() * 0.7 + 0.3,
              duration: 200 + Math.random() * 400,
              useNativeDriver: true,
              delay: i * 15,
            }),
            Animated.timing(anim, {
              toValue: 0.1 + Math.random() * 0.2,
              duration: 200 + Math.random() * 400,
              useNativeDriver: true,
            }),
          ])
        )
      );
      animations.forEach((a) => a.start());
      return () => animations.forEach((a) => a.stop());
    } else {
      anims.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 0.15,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [active]);

  return (
    <View style={[styles.container, { height }]}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              height: height,
              transform: [{ scaleY: anim }],
              backgroundColor:
                i % 3 === 0 ? COLORS.emerald : COLORS.mint300,
              opacity: active ? 0.9 : 0.3,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
});

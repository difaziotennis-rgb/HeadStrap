import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { LogIn } from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import CloverLogo from "../components/CloverLogo";
import { login, signup } from "../services/mockBackend";
import { COLORS } from "../constants/theme";
import { RootStackParamList } from "../types";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">;
};

export default function LoginScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    try {
      // Auto-create or retrieve account — no fields needed
      let user = await login("user@clover.app", "");
      if (!user) {
        user = await signup("user@clover.app", "", "Clover User");
      }
      if (!user.verified) {
        navigation.replace("HumanVerification");
      } else if (!user.calibrated) {
        navigation.replace("Calibration");
      } else {
        navigation.replace("MainTabs");
      }
    } catch (e) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.darkBg, COLORS.slate800, COLORS.darkBg]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoSection}>
            <CloverLogo size="lg" />
            <Text style={styles.tagline}>
              Your work. Your data. Your earnings.
            </Text>
          </View>

          <View style={styles.form}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAuth}
              activeOpacity={0.8}
              disabled={loading}
            >
              <LinearGradient
                colors={[COLORS.emerald, COLORS.mint500]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <LogIn size={20} color={COLORS.white} />
                    <Text style={styles.buttonText}>Get Started</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            By continuing, you agree to Clover's Terms of Service and Privacy
            Policy. Your professional data is encrypted and secure.
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 48,
  },
  tagline: {
    color: COLORS.slate400,
    fontSize: 14,
    fontWeight: "500",
    marginTop: 12,
    letterSpacing: 0.5,
  },
  form: {
    gap: 14,
  },
  primaryButton: {
    marginTop: 8,
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
  disclaimer: {
    color: COLORS.slate500,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 32,
    paddingHorizontal: 16,
  },
});

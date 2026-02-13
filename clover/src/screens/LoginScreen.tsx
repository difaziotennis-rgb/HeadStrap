import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { LogIn, UserPlus, Mail, Lock, User } from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import CloverLogo from "../components/CloverLogo";
import { login, signup } from "../services/mockBackend";
import { COLORS } from "../constants/theme";
import { RootStackParamList } from "../types";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">;
};

export default function LoginScreen({ navigation }: Props) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    try {
      const useEmail = email || "user@clover.app";
      const useName = name || "Clover User";

      if (isSignup) {
        await signup(useEmail, password, useName);
        navigation.replace("HumanVerification");
      } else {
        let user = await login(useEmail, password);
        if (!user) {
          // Auto-create account so login always works
          user = await signup(useEmail, password, useName);
        }
        if (!user.verified) {
          navigation.replace("HumanVerification");
        } else if (!user.calibrated) {
          navigation.replace("Calibration");
        } else {
          navigation.replace("MainTabs");
        }
      }
    } catch (e) {
      // Just go through anyway
      navigation.replace("HumanVerification");
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          <View style={styles.logoSection}>
            <CloverLogo size="lg" />
            <Text style={styles.tagline}>
              Your work. Your data. Your earnings.
            </Text>
          </View>

          <View style={styles.form}>
            {isSignup && (
              <View style={styles.inputWrapper}>
                <User
                  size={18}
                  color={COLORS.slate400}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={COLORS.slate500}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputWrapper}>
              <Mail
                size={18}
                color={COLORS.slate400}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor={COLORS.slate500}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Lock
                size={18}
                color={COLORS.slate400}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={COLORS.slate500}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

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
                    {isSignup ? (
                      <UserPlus size={20} color={COLORS.white} />
                    ) : (
                      <LogIn size={20} color={COLORS.white} />
                    )}
                    <Text style={styles.buttonText}>
                      {isSignup ? "Create Account" : "Sign In"}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsSignup(!isSignup)}
            >
              <Text style={styles.switchText}>
                {isSignup
                  ? "Already have an account? "
                  : "Don't have an account? "}
                <Text style={styles.switchTextBold}>
                  {isSignup ? "Sign In" : "Sign Up"}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            By continuing, you agree to Clover's Terms of Service and Privacy
            Policy. Your professional data is encrypted and secure.
          </Text>
        </KeyboardAvoidingView>
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
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "500",
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
  switchButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  switchText: {
    color: COLORS.slate400,
    fontSize: 14,
  },
  switchTextBold: {
    color: COLORS.emerald,
    fontWeight: "700",
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

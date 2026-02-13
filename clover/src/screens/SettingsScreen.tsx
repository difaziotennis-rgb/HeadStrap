import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Settings,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  LogOut,
  Shield,
  CloudUpload,
  FileText,
  ExternalLink,
  AlertCircle,
} from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  getUser,
  updateUser,
  logout,
  paymentService,
  dataCollectionService,
} from "../services/api";
import { COLORS } from "../constants/theme";
import { RootStackParamList, User } from "../types";

type Props = {
  navigation?: NativeStackNavigationProp<RootStackParamList>;
};

export default function SettingsScreen({ navigation }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUser();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadUser = async () => {
    const u = await getUser();
    setUser(u);
  };

  const handleConnectStripe = async () => {
    if (!user) return;
    setConnectingStripe(true);
    try {
      const result = await paymentService.createConnectAccount(user.id);
      // In production, this would open the Stripe onboarding URL
      // Linking.openURL(result.onboardingUrl);
      Alert.alert(
        "Stripe Connected",
        "Your payment account has been set up. You can now receive payouts when your data is sold."
      );
      await loadUser();
    } catch (e) {
      Alert.alert("Error", "Failed to set up payment account.");
    } finally {
      setConnectingStripe(false);
    }
  };

  const handleExportData = async () => {
    try {
      const manifest = await dataCollectionService.exportDataManifest();
      const data = await dataCollectionService.getAllUserData();
      Alert.alert(
        "Data Export",
        `${data.sessions.length} sessions\n${data.totalDataMB.toFixed(0)} MB total\n${data.uploadedCount} uploaded to cloud\n${data.pendingCount} pending upload\n\nManifest ready for backend.`
      );
      console.log("[DataExport] Manifest:", manifest);
    } catch (e) {
      Alert.alert("Error", "Failed to export data.");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          // Navigate back to login
        },
      },
    ]);
  };

  const isStripeConnected =
    user?.payoutMethod === "stripe" && !!user?.stripeConnectId;

  return (
    <LinearGradient
      colors={[COLORS.darkBg, "#0D1117", COLORS.darkBg]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <View style={styles.header}>
            <Settings size={22} color={COLORS.emerald} />
            <Text style={styles.headerTitle}>SETTINGS</Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Payment Section */}
            <Text style={styles.sectionTitle}>PAYMENT METHOD</Text>
            <View style={styles.card}>
              {isStripeConnected ? (
                <View style={styles.connectedRow}>
                  <View style={styles.connectedLeft}>
                    <View style={styles.connectedIcon}>
                      <CheckCircle2 size={24} color={COLORS.emerald} />
                    </View>
                    <View>
                      <Text style={styles.connectedTitle}>
                        Stripe Connected
                      </Text>
                      <Text style={styles.connectedSub}>
                        Account: {user?.stripeConnectId?.slice(0, 12)}...
                      </Text>
                    </View>
                  </View>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>ACTIVE</Text>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.setupRow}>
                    <CreditCard size={20} color={COLORS.slate400} />
                    <View style={styles.setupText}>
                      <Text style={styles.setupTitle}>
                        Set Up Payouts
                      </Text>
                      <Text style={styles.setupSub}>
                        Connect your Stripe account to receive payments when your
                        data is sold.
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.connectButton}
                    onPress={handleConnectStripe}
                    activeOpacity={0.8}
                    disabled={connectingStripe}
                  >
                    <LinearGradient
                      colors={["#635BFF", "#7A73FF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.connectButtonGradient}
                    >
                      <Text style={styles.connectButtonText}>
                        {connectingStripe
                          ? "Connecting..."
                          : "Connect with Stripe"}
                      </Text>
                      <ExternalLink size={16} color={COLORS.white} />
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* How Payouts Work */}
            <Text style={styles.sectionTitle}>HOW PAYOUTS WORK</Text>
            <View style={styles.card}>
              {[
                {
                  step: "1",
                  title: "You record professional work",
                  desc: "Your video & audio data is uploaded securely.",
                },
                {
                  step: "2",
                  title: "Data is packaged & listed for sale",
                  desc: "We find buyers for your professional data.",
                },
                {
                  step: "3",
                  title: "Revenue split after sale",
                  desc: "60% goes to you, 40% to the platform. Only after a sale.",
                },
                {
                  step: "4",
                  title: "Payout to your account",
                  desc: "Request payout anytime from the Vault. Sent via Stripe.",
                },
              ].map((item, i) => (
                <View
                  key={i}
                  style={[
                    styles.stepRow,
                    i < 3 && styles.stepRowBorder,
                  ]}
                >
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{item.step}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>{item.title}</Text>
                    <Text style={styles.stepDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Data & Privacy */}
            <Text style={styles.sectionTitle}>DATA & PRIVACY</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleExportData}
              >
                <View style={styles.menuLeft}>
                  <CloudUpload size={20} color={COLORS.emerald} />
                  <Text style={styles.menuText}>Export My Data</Text>
                </View>
                <ChevronRight size={18} color={COLORS.slate500} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <View style={styles.menuItem}>
                <View style={styles.menuLeft}>
                  <Shield size={20} color={COLORS.emerald} />
                  <Text style={styles.menuText}>Privacy Policy</Text>
                </View>
                <ChevronRight size={18} color={COLORS.slate500} />
              </View>

              <View style={styles.menuDivider} />

              <View style={styles.menuItem}>
                <View style={styles.menuLeft}>
                  <FileText size={20} color={COLORS.emerald} />
                  <Text style={styles.menuText}>Terms of Service</Text>
                </View>
                <ChevronRight size={18} color={COLORS.slate500} />
              </View>
            </View>

            {/* Earnings Note */}
            <View style={styles.noteCard}>
              <AlertCircle size={16} color={COLORS.yellow} />
              <Text style={styles.noteText}>
                All earnings displayed during recording are estimates based on
                average market rates for professional data. Actual earnings are
                determined when your data is purchased by a buyer. The 60/40
                revenue split only applies after a confirmed sale.
              </Text>
            </View>

            {/* Logout */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <LogOut size={18} color={COLORS.red} />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: COLORS.slate400,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 18,
    marginBottom: 20,
  },
  // Connected state
  connectedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  connectedLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  connectedIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(72,187,120,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  connectedTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  connectedSub: {
    color: COLORS.slate500,
    fontSize: 12,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: "rgba(72,187,120,0.15)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeBadgeText: {
    color: COLORS.emerald,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  // Setup state
  setupRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  setupText: {
    flex: 1,
  },
  setupTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  setupSub: {
    color: COLORS.slate500,
    fontSize: 13,
    lineHeight: 19,
  },
  connectButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  connectButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 12,
  },
  connectButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },
  // Steps
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
  },
  stepRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(72,187,120,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: COLORS.emerald,
    fontSize: 13,
    fontWeight: "800",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  stepDesc: {
    color: COLORS.slate500,
    fontSize: 12,
    lineHeight: 17,
  },
  // Menu items
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "500",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  // Note
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(246, 224, 94, 0.06)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(246, 224, 94, 0.12)",
    padding: 16,
    marginBottom: 24,
  },
  noteText: {
    color: COLORS.slate400,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  // Logout
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: "rgba(252, 129, 129, 0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(252, 129, 129, 0.15)",
  },
  logoutText: {
    color: COLORS.red,
    fontSize: 15,
    fontWeight: "600",
  },
});

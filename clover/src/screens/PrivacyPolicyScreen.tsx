import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Shield } from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { COLORS } from "../constants/theme";
import { RootStackParamList } from "../types";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "PrivacyPolicy">;
};

export default function PrivacyPolicyScreen({ navigation }: Props) {
  return (
    <LinearGradient colors={[COLORS.darkBg, "#0D1117", COLORS.darkBg]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
            <ChevronLeft size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Shield size={18} color={COLORS.emerald} />
          <Text style={s.title}>Privacy Policy</Text>
        </View>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={s.updated}>Last updated: February 12, 2026</Text>

          <Text style={s.h2}>1. Introduction</Text>
          <Text style={s.p}>
            Clover ("we," "our," or "the Platform") operates a data collection platform that enables professional
            tradespeople ("Users," "Contributors," or "you") to record video and audio of their work, which is then
            packaged and licensed to third-party buyers for AI training and other lawful commercial purposes.
            {"\n\n"}
            This Privacy Policy explains what data we collect, how we use it, how we share it, and your rights
            regarding your personal information.
          </Text>

          <Text style={s.h2}>2. Data We Collect</Text>
          <Text style={s.h3}>2.1 Account Information</Text>
          <Text style={s.p}>
            When you create an account, we collect your name, email address, and payment information (via Stripe Connect).
            We store a hashed version of your password — we never store passwords in plain text.
          </Text>
          <Text style={s.h3}>2.2 Recording Data</Text>
          <Text style={s.p}>
            When you use the recording feature, the Platform captures video and audio from your device's camera and
            microphone. This includes:{"\n"}
            • Video footage of your work environment and activities{"\n"}
            • Audio narration you provide describing your work{"\n"}
            • Metadata including recording duration, timestamp, file size, and device information{"\n"}
            • Your selection of job type/category
          </Text>
          <Text style={s.h3}>2.3 Device & Usage Data</Text>
          <Text style={s.p}>
            We collect basic device information (device type, operating system) and usage data (features used,
            session frequency) to improve the Platform.
          </Text>
          <Text style={s.h3}>2.4 Payment Data</Text>
          <Text style={s.p}>
            Payment processing is handled by Stripe. We do not store your bank account numbers or credit card details.
            We receive a Stripe Connect account identifier to process payouts.
          </Text>

          <Text style={s.h2}>3. How We Use Your Data</Text>
          <Text style={s.p}>
            • <Text style={s.bold}>Recording data</Text> is uploaded to secure cloud storage (Microsoft Azure),
              packaged into data sets, and licensed to vetted third-party buyers for AI model training, research,
              and other lawful commercial purposes.{"\n"}
            • <Text style={s.bold}>Account information</Text> is used to manage your account, process payouts,
              and communicate with you about your earnings and platform updates.{"\n"}
            • <Text style={s.bold}>Usage data</Text> is used to improve the Platform, fix bugs, and understand
              how our features are used.
          </Text>

          <Text style={s.h2}>4. Revenue Sharing</Text>
          <Text style={s.p}>
            When your data is sold to a buyer, revenue is split between you and the Platform:{"\n"}
            • <Text style={s.bold}>Narrated recordings:</Text> 60% to you, 40% to the Platform{"\n"}
            • <Text style={s.bold}>Silent recordings:</Text> 40% to you, 60% to the Platform{"\n\n"}
            Earnings displayed during recording are <Text style={s.bold}>estimates only</Text>. Actual earnings are
            determined at the time of sale and may differ from estimates. Revenue splits apply only after a confirmed
            sale — unsold data generates no earnings.
          </Text>

          <Text style={s.h2}>5. Data Storage & Security</Text>
          <Text style={s.p}>
            Recording data is stored on Microsoft Azure cloud infrastructure with encryption at rest and in transit.
            Account data is stored in our secure database. We use industry-standard security measures including HTTPS,
            JWT token authentication, and bcrypt password hashing. While no system is 100% secure, we take reasonable
            steps to protect your data.
          </Text>

          <Text style={s.h2}>6. Data Sharing</Text>
          <Text style={s.p}>
            We share your data with:{"\n"}
            • <Text style={s.bold}>Data buyers:</Text> Your recording data (video, audio, metadata) is licensed
              to vetted third-party buyers. Recordings are associated with job type and category but your personal
              identity (name, email) is not shared with buyers unless you consent.{"\n"}
            • <Text style={s.bold}>Stripe:</Text> Payment information for processing payouts.{"\n"}
            • <Text style={s.bold}>Microsoft Azure:</Text> Cloud storage for recording data.{"\n"}
            • <Text style={s.bold}>Legal requirements:</Text> We may disclose data if required by law, subpoena,
              or to protect our legal rights.
          </Text>

          <Text style={s.h2}>7. Your Rights</Text>
          <Text style={s.p}>
            You have the right to:{"\n"}
            • <Text style={s.bold}>Access</Text> your personal data via the "Export My Data" feature in Settings{"\n"}
            • <Text style={s.bold}>Delete</Text> your account and associated personal data by contacting us{"\n"}
            • <Text style={s.bold}>Withdraw consent</Text> for future recordings at any time by stopping use of the recording feature{"\n"}
            • <Text style={s.bold}>Request correction</Text> of inaccurate personal data{"\n\n"}
            Note: Once recording data has been sold and delivered to a buyer, we cannot retrieve or delete it from
            the buyer's systems. Data that has been uploaded but not yet sold can be removed upon request.
          </Text>

          <Text style={s.h2}>8. Data Retention</Text>
          <Text style={s.p}>
            Account data is retained as long as your account is active. Recording data is retained in cloud storage
            until it is sold and delivered, or until you request deletion. Financial records (earnings, payouts) are
            retained for 7 years for tax and legal compliance.
          </Text>

          <Text style={s.h2}>9. Children's Privacy</Text>
          <Text style={s.p}>
            Clover is not intended for use by anyone under 18 years of age. We do not knowingly collect personal
            information from minors.
          </Text>

          <Text style={s.h2}>10. International Data Transfers</Text>
          <Text style={s.p}>
            Your data may be processed and stored in the United States and other countries where our service
            providers operate. By using the Platform, you consent to the transfer of your data to these jurisdictions.
          </Text>

          <Text style={s.h2}>11. Changes to This Policy</Text>
          <Text style={s.p}>
            We may update this Privacy Policy from time to time. We will notify you of material changes via the
            Platform or email. Continued use of the Platform after changes constitutes acceptance of the updated policy.
          </Text>

          <Text style={s.h2}>12. Contact</Text>
          <Text style={s.p}>
            For privacy questions, data requests, or concerns, contact us at:{"\n\n"}
            privacy@cloverdata.io
          </Text>

          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 14 },
  back: { padding: 4, marginRight: 4 },
  title: { color: COLORS.white, fontSize: 17, fontWeight: "700" },
  content: { paddingHorizontal: 24, paddingTop: 8 },
  updated: { color: COLORS.slate500, fontSize: 12, marginBottom: 20 },
  h2: { color: COLORS.emerald, fontSize: 16, fontWeight: "700", marginTop: 24, marginBottom: 8 },
  h3: { color: COLORS.white, fontSize: 14, fontWeight: "600", marginTop: 12, marginBottom: 6 },
  p: { color: COLORS.slate400, fontSize: 14, lineHeight: 22, marginBottom: 8 },
  bold: { color: COLORS.slate300, fontWeight: "600" },
});

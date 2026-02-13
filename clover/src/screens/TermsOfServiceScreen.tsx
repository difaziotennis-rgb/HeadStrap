import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, FileText } from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { COLORS } from "../constants/theme";
import { RootStackParamList } from "../types";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "TermsOfService">;
};

export default function TermsOfServiceScreen({ navigation }: Props) {
  return (
    <LinearGradient colors={[COLORS.darkBg, "#0D1117", COLORS.darkBg]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
            <ChevronLeft size={22} color={COLORS.white} />
          </TouchableOpacity>
          <FileText size={18} color={COLORS.emerald} />
          <Text style={s.title}>Terms of Service</Text>
        </View>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={s.updated}>Last updated: February 12, 2026</Text>

          <Text style={s.h2}>1. Acceptance of Terms</Text>
          <Text style={s.p}>
            By creating an account or using the Clover platform ("Platform"), you agree to be bound by these
            Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Platform.
          </Text>

          <Text style={s.h2}>2. Eligibility</Text>
          <Text style={s.p}>
            You must be at least 18 years old and legally able to enter into contracts to use the Platform.
            By using Clover, you represent that you meet these requirements. You must be a real, human user —
            automated or bot accounts are not permitted.
          </Text>

          <Text style={s.h2}>3. Account Responsibilities</Text>
          <Text style={s.p}>
            You are responsible for maintaining the security of your account credentials. You must provide accurate
            information during registration and keep your information up to date. You are responsible for all
            activity under your account. Notify us immediately if you suspect unauthorized access.
          </Text>

          <Text style={s.h2}>4. The Service</Text>
          <Text style={s.p}>
            Clover provides a platform for professional tradespeople to:{"\n"}
            • Record video and audio of professional work using their mobile device{"\n"}
            • Earn revenue when their recorded data is sold to third-party buyers{"\n"}
            • Track estimated and actual earnings{"\n"}
            • Receive payouts via Stripe Connect{"\n\n"}
            You understand that Clover acts as a marketplace connecting data contributors with data buyers.
            We do not guarantee that your data will be purchased.
          </Text>

          <Text style={s.h2}>5. Recording & Data Contribution</Text>
          <Text style={s.h3}>5.1 Ownership & License</Text>
          <Text style={s.p}>
            You retain ownership of the raw recordings you create. However, by uploading recordings through the
            Platform, you grant Clover a worldwide, non-exclusive, transferable, sublicensable license to:{"\n"}
            • Store, process, and organize your recordings{"\n"}
            • Package recordings into data sets for sale{"\n"}
            • License recordings to third-party buyers for AI training, research, and other lawful commercial use{"\n"}
            • Use anonymized excerpts for marketing and demonstration purposes
          </Text>
          <Text style={s.h3}>5.2 Content Requirements</Text>
          <Text style={s.p}>
            Recordings must depict lawful professional work activities. You must not record:{"\n"}
            • Activities in locations where you lack permission to record{"\n"}
            • Private residences or areas with an expectation of privacy without consent{"\n"}
            • Identifiable individuals (faces, name tags) without their knowledge and consent{"\n"}
            • Illegal activities, dangerous practices, or content that violates safety regulations{"\n"}
            • Content protected by third-party intellectual property rights{"\n\n"}
            You are solely responsible for ensuring you have all necessary rights and permissions for your recordings.
          </Text>
          <Text style={s.h3}>5.3 Narration</Text>
          <Text style={s.p}>
            Narrated recordings — where you describe your work process verbally — are valued more highly by
            data buyers. Narration must be accurate and relevant to the work being performed. Do not include
            personal information, offensive language, or confidential business information in your narration.
          </Text>

          <Text style={s.h2}>6. Earnings & Payouts</Text>
          <Text style={s.h3}>6.1 Revenue Split</Text>
          <Text style={s.p}>
            When your data is sold, revenue is split as follows:{"\n"}
            • <Text style={s.bold}>Narrated recordings:</Text> 60% to you, 40% to the Platform{"\n"}
            • <Text style={s.bold}>Silent recordings:</Text> 40% to you, 60% to the Platform{"\n\n"}
            These splits may be adjusted with 30 days' notice to you.
          </Text>
          <Text style={s.h3}>6.2 Estimated vs. Actual Earnings</Text>
          <Text style={s.p}>
            Earnings displayed during and immediately after recording are <Text style={s.bold}>estimates only</Text>,
            based on historical average rates for similar data. Actual earnings are determined only when your
            data is purchased by a buyer and may be higher or lower than estimates. Estimated earnings do not
            constitute a guarantee, promise, or obligation of payment.
          </Text>
          <Text style={s.h3}>6.3 Payouts</Text>
          <Text style={s.p}>
            Payouts are processed via Stripe Connect. You must connect a valid Stripe account to receive payments.
            Minimum payout threshold is $5.00 USD. Payouts are typically processed within 3-7 business days after
            request. You are responsible for any taxes due on earnings received through the Platform.
          </Text>
          <Text style={s.h3}>6.4 No Guaranteed Sales</Text>
          <Text style={s.p}>
            Clover does not guarantee that any recording will be sold. Data may remain unsold indefinitely.
            You have no claim to payment for unsold data.
          </Text>

          <Text style={s.h2}>7. Prohibited Conduct</Text>
          <Text style={s.p}>
            You may not:{"\n"}
            • Submit fraudulent, fabricated, or artificially generated recordings{"\n"}
            • Use bots, scripts, or automation to interact with the Platform{"\n"}
            • Attempt to manipulate earnings or recording metrics{"\n"}
            • Reverse-engineer, scrape, or copy the Platform{"\n"}
            • Share your account with others or operate multiple accounts{"\n"}
            • Violate any applicable law, regulation, or third-party rights
          </Text>

          <Text style={s.h2}>8. Termination</Text>
          <Text style={s.p}>
            You may delete your account at any time via the app or by contacting us. We may suspend or terminate
            your account for violation of these Terms, fraudulent activity, or extended inactivity (12+ months with
            no recordings).{"\n\n"}
            Upon termination:{"\n"}
            • Unsold data will be removed from the marketplace{"\n"}
            • Any pending payouts for already-sold data will still be processed{"\n"}
            • Data already sold and delivered to buyers cannot be recalled{"\n"}
            • Your personal account data will be deleted within 30 days, except as required for legal or financial records
          </Text>

          <Text style={s.h2}>9. Intellectual Property</Text>
          <Text style={s.p}>
            The Clover brand, logo, app design, and platform code are the property of Clover and protected by
            intellectual property laws. These Terms do not grant you any rights to our trademarks or proprietary
            technology.
          </Text>

          <Text style={s.h2}>10. Disclaimers</Text>
          <Text style={s.p}>
            THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE." WE MAKE NO WARRANTIES, EXPRESS OR IMPLIED,
            INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE.
          </Text>

          <Text style={s.h2}>11. Limitation of Liability</Text>
          <Text style={s.p}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, CLOVER SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUE, WHETHER DIRECT
            OR INDIRECT. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT OF PAYOUTS ACTUALLY PAID TO YOU IN
            THE 12 MONTHS PRECEDING THE CLAIM.
          </Text>

          <Text style={s.h2}>12. Indemnification</Text>
          <Text style={s.p}>
            You agree to indemnify and hold Clover harmless from any claims, damages, or expenses arising from
            your recordings, your violation of these Terms, or your violation of any third-party rights.
          </Text>

          <Text style={s.h2}>13. Dispute Resolution</Text>
          <Text style={s.p}>
            Any disputes arising from these Terms or your use of the Platform shall be resolved through binding
            arbitration, except where prohibited by law. You waive your right to participate in class action
            lawsuits against Clover.
          </Text>

          <Text style={s.h2}>14. Modifications</Text>
          <Text style={s.p}>
            We may modify these Terms at any time. Material changes will be communicated via the Platform or email
            with at least 14 days' notice. Continued use after the effective date constitutes acceptance.
          </Text>

          <Text style={s.h2}>15. Governing Law</Text>
          <Text style={s.p}>
            These Terms are governed by the laws of the State of Delaware, United States, without regard to
            conflict of law principles.
          </Text>

          <Text style={s.h2}>16. Contact</Text>
          <Text style={s.p}>
            For questions about these Terms, contact us at:{"\n\n"}
            legal@cloverdata.io
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

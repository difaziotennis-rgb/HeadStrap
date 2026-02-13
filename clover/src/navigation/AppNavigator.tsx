import React from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  CirclePlay,
  Vault,
  Settings,
} from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { RootStackParamList, MainTabParamList } from "../types";

import LoginScreen from "../screens/LoginScreen";
import HumanVerificationScreen from "../screens/HumanVerificationScreen";
import CalibrationScreen from "../screens/CalibrationScreen";
import DashboardScreen from "../screens/DashboardScreen";
import VaultScreen from "../screens/VaultScreen";
import SettingsScreen from "../screens/SettingsScreen";
import RecorderScreen from "../screens/RecorderScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.darkBg,
          borderTopColor: "rgba(255,255,255,0.06)",
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 28,
          paddingTop: 12,
        },
        tabBarActiveTintColor: COLORS.emerald,
        tabBarInactiveTintColor: COLORS.slate500,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 1,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: "GO",
          tabBarIcon: ({ color, size }) => (
            <View style={styles.tabIconContainer}>
              <CirclePlay size={size} color={color} strokeWidth={1.5} />
              {color === COLORS.emerald && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Vault"
        component={VaultScreen}
        options={{
          tabBarLabel: "VAULT",
          tabBarIcon: ({ color, size }) => (
            <View style={styles.tabIconContainer}>
              <Vault size={size} color={color} strokeWidth={1.5} />
              {color === COLORS.emerald && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: "SETTINGS",
          tabBarIcon: ({ color, size }) => (
            <View style={styles.tabIconContainer}>
              <Settings size={size} color={color} strokeWidth={1.5} />
              {color === COLORS.emerald && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.darkBg },
          animation: "fade",
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen
          name="HumanVerification"
          component={HumanVerificationScreen}
        />
        <Stack.Screen name="Calibration" component={CalibrationScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="Recorder"
          component={RecorderScreen}
          options={{
            animation: "slide_from_bottom",
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: "center",
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.emerald,
    marginTop: 4,
    shadowColor: COLORS.emerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});

import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { COLORS, TYPOGRAPHY } from "@/constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.onSurfaceVariant,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          <BlurView
            intensity={40}
            tint='light'
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarStyle: {
          backgroundColor:
            Platform.OS === "android" ? COLORS.background : "transparent",
          position: "absolute",
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarLabelStyle: {
          ...TYPOGRAPHY.labelMd,
          marginTop: -4,
          marginBottom: 4,
        },
      }}>
      <Tabs.Screen
        name='index'
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name='calendar-today' size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='timeline'
        options={{
          title: "Timeline",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name='auto-stories' size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='analytics'
        options={{
          title: "Analytics",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name='analytics' size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name='person' size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

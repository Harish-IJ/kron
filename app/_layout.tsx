import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { Inter_700Bold, Inter_900Black } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { initDb } from '../src/db/client';
import { useAppStore } from '../src/store/app-store';
import { useLogsStore } from '../src/store/logs-store';
import { colors } from '../src/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const initialize = useAppStore(s => s.initialize);
  const loadLogs = useLogsStore(s => s.load);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Bold': Inter_700Bold,
    'Inter-Black': Inter_900Black,
    'JetBrainsMono-Regular': JetBrainsMono_400Regular,
  });

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;
    (async () => {
      try {
        await initDb();
        await loadLogs();
        await initialize();
      } finally {
        setDbReady(true);
        await SplashScreen.hideAsync();
      }
    })();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;
  if (!dbReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.base, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  const headerCommon = {
    headerStyle: { backgroundColor: colors.base },
    headerTitleStyle: { fontFamily: 'Inter-Bold', fontSize: 13, letterSpacing: 1.4 },
    headerTintColor: colors.ink,
    headerShadowVisible: false,
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="log/new" options={{ presentation: 'modal', title: 'NEW LOG', ...headerCommon }} />
        <Stack.Screen name="log/[id]" options={{ presentation: 'modal', title: 'EDIT LOG', ...headerCommon }} />
      </Stack>
      <StatusBar style="dark" backgroundColor={colors.base} />
    </GestureHandlerRootView>
  );
}

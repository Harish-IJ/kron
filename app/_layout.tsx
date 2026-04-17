import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { 
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from '@expo-google-fonts/inter';

import { DatabaseProvider } from '@/contexts/DatabaseProvider';
import { StreakProvider } from '@/contexts/StreakContext';
import { LoggingProvider } from '@/contexts/LoggingContext';

import { COLORS } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <DatabaseProvider>
        <StreakProvider>
          <LoggingProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="streak/[id]"
                options={{
                  title: 'Streak Detail',
                  headerBackTitle: 'Back',
                }}
              />
              <Stack.Screen
                name="create-streak"
                options={{
                  presentation: 'modal',
                  title: 'New Ritual',
                }}
              />
              <Stack.Screen
                name="edit-streak/[id]"
                options={{
                  presentation: 'modal',
                  title: 'Edit Ritual',
                }}
              />
            </Stack>
            <StatusBar style="auto" />
          </LoggingProvider>
        </StreakProvider>
      </DatabaseProvider>
    </GestureHandlerRootView>
  );
}

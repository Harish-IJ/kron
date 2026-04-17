import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DatabaseProvider } from '@/contexts/DatabaseProvider';
import { StreakProvider } from '@/contexts/StreakContext';
import { LoggingProvider } from '@/contexts/LoggingContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { DatabaseProvider } from '@/contexts/DatabaseProvider';
import { StreakProvider } from '@/contexts/StreakContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <StreakProvider>
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
      </StreakProvider>
    </DatabaseProvider>
  );
}

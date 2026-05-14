import React, { useLayoutEffect } from 'react';
import { ScrollView, Pressable, StyleSheet } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useActiveStreak } from '../../src/hooks/use-streak';
import { StreakCard } from '../../src/components/features/StreakCard';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Icon } from '../../src/components/ui/Icon';
import { colors, space } from '../../src/constants/theme';

export default function HomeScreen() {
  const { streaks, streakStates, isLoading, setActiveStreak } = useActiveStreak();
  const navigation = useNavigation();
  const canAddStreak = streaks.length < 10;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: canAddStreak
        ? () => (
            <Pressable
              onPress={() => router.push('/streak/new' as any)}
              hitSlop={8}
              style={{ marginRight: 16 }}
              accessibilityLabel="Add streak"
              accessibilityRole="button"
            >
              <Icon name="plus" size={22} color={colors.ink} />
            </Pressable>
          )
        : undefined,
    });
  }, [navigation, canAddStreak]);

  if (isLoading) return null;

  if (streaks.length === 0) {
    return (
      <EmptyState
        headline="NO STREAKS"
        subtext="Create your first streak to get started."
        actionLabel="CREATE STREAK"
        onAction={() => router.push('/streak/new' as any)}
      />
    );
  }

  const handleStreakPress = (id: string) => {
    setActiveStreak(id);
    router.push('/(tabs)/feed' as any);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {streaks.map(streak => (
        <StreakCard
          key={streak.id}
          streak={streak}
          streakState={streakStates[streak.id]}
          onPress={() => handleStreakPress(streak.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.base },
  content: { padding: space[5], paddingBottom: space[9] },
});

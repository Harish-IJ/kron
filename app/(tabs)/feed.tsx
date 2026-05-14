import React, { useLayoutEffect } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useActiveStreak } from '../../src/hooks/use-streak';
import { useLogs } from '../../src/hooks/use-logs';
import { FeedLogCard } from '../../src/components/features/FeedLogCard';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Icon } from '../../src/components/ui/Icon';
import { colors, space } from '../../src/constants/theme';

export default function FeedScreen() {
  const { activeStreakId } = useActiveStreak();
  const { logs, delete: deleteLog } = useLogs(activeStreakId ?? '');
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: activeStreakId
        ? () => (
            <Pressable
              onPress={() =>
                router.push({ pathname: '/log/new', params: { streakId: activeStreakId } } as any)
              }
              hitSlop={8}
              style={{ marginRight: 16 }}
              accessibilityLabel="New log"
              accessibilityRole="button"
            >
              <Icon name="plus" size={22} color={colors.ink} />
            </Pressable>
          )
        : undefined,
    });
  }, [navigation, activeStreakId]);

  if (!activeStreakId) {
    return (
      <EmptyState
        headline="NO STREAK SELECTED"
        subtext="Select a streak from Home to see its feed."
        actionLabel="GO TO HOME"
        onAction={() => router.push('/(tabs)/' as any)}
      />
    );
  }

  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (sortedLogs.length === 0) {
    return (
      <EmptyState
        headline="NO ENTRIES YET"
        subtext="Your logs will appear here."
        actionLabel="LOG TODAY"
        onAction={() =>
          router.push({ pathname: '/log/new', params: { streakId: activeStreakId } } as any)
        }
      />
    );
  }

  return (
    <FlatList
      data={sortedLogs}
      keyExtractor={l => l.id}
      renderItem={({ item }) => (
        <FeedLogCard
          log={item}
          onEdit={id => router.push(`/log/${id}` as any)}
          onDelete={id => deleteLog(id)}
        />
      )}
      style={styles.list}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.base },
  content: { padding: space[5], paddingBottom: space[9] },
});

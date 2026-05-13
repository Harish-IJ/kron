import React, { useLayoutEffect } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useLogs } from '../../src/hooks/use-logs';
import { FeedLogCard } from '../../src/components/features/FeedLogCard';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Icon } from '../../src/components/ui/Icon';
import { colors, space } from '../../src/constants/theme';

export default function FeedScreen() {
  const { logs, delete: deleteLog } = useLogs();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => router.push('/log/new')} hitSlop={8} style={{ marginRight: 16 }}>
          <Icon name="plus" size={22} color={colors.ink} />
        </Pressable>
      ),
    });
  }, [navigation]);

  const sortedLogs = [...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (sortedLogs.length === 0) {
    return (
      <EmptyState
        headline="NO ENTRIES YET"
        subtext="Your logs will appear here."
        actionLabel="LOG TODAY"
        onAction={() => router.push('/log/new')}
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
          onEdit={id => router.push(`/log/${id}`)}
          onDelete={deleteLog}
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

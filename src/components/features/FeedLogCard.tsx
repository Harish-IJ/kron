import React, { useRef } from 'react';
import { View, Pressable, StyleSheet, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { Typography } from '../ui/Typography';
import { RatingBadge } from '../ui/RatingBadge';
import { colors, borders, shadows, space } from '../../constants/theme';
import { getAbsolutePath } from '../../services/media-service';
import type { Log } from '../../domain/types';

interface FeedLogCardProps {
  log: Log;
  bucketLabel?: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function FeedLogCard({ log, bucketLabel, onEdit, onDelete }: FeedLogCardProps) {
  const swipeRef = useRef<Swipeable>(null);

  const renderRightActions = () => (
    <View style={styles.actions}>
      <Pressable style={[styles.actionBtn, styles.editBtn]} onPress={() => { swipeRef.current?.close(); onEdit(log.id); }}>
        <Typography variant="label" color={colors.base}>EDIT</Typography>
      </Pressable>
      <Pressable
        style={[styles.actionBtn, styles.deleteBtn]}
        onPress={() => {
          swipeRef.current?.close();
          Alert.alert('Delete Log', 'This will recompute your streak history.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => onDelete(log.id) },
          ]);
        }}
      >
        <Typography variant="label" color={colors.base}>DELETE</Typography>
      </Pressable>
    </View>
  );

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} friction={2} rightThreshold={80}>
      <View style={styles.card}>
        <View style={styles.accent} />
        <View style={styles.content}>
          <Typography variant="label" numberOfLines={1}>{log.title}</Typography>
          <Typography variant="caption" style={styles.ts}>{formatTimestamp(log.createdAt)}</Typography>
          {log.mediaPath && (
            <Image
              source={{ uri: getAbsolutePath(log.mediaPath) }}
              style={styles.media}
              contentFit="cover"
              placeholder={null}
            />
          )}
          {log.description ? (
            <Typography variant="mono" color={`${colors.ink}B0`} numberOfLines={2} style={styles.desc}>
              {log.description}
            </Typography>
          ) : null}
          <View style={styles.bottomRow}>
            <RatingBadge value={log.rating} readonly />
            {bucketLabel && <Typography variant="caption">{bucketLabel}</Typography>}
          </View>
        </View>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.base,
    borderWidth: borders.card.borderWidth,
    borderColor: borders.card.borderColor,
    shadowColor: shadows.card.shadowColor,
    shadowOffset: shadows.card.shadowOffset,
    shadowOpacity: shadows.card.shadowOpacity,
    shadowRadius: shadows.card.shadowRadius,
    elevation: shadows.card.elevation,
    marginBottom: space[3],
  },
  accent: { width: 4, backgroundColor: colors.navy },
  content: { flex: 1, padding: 16 },
  ts: { marginBottom: space[2] },
  media: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.navy, marginBottom: space[2] },
  desc: { marginBottom: space[2] },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  actions: { flexDirection: 'row', marginBottom: space[3] },
  actionBtn: { width: 72, alignItems: 'center', justifyContent: 'center' },
  editBtn: { backgroundColor: colors.navy },
  deleteBtn: { backgroundColor: colors.orange },
});

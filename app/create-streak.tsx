import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';

import * as streakService from '@/services/streakService';
import { useStreakContext } from '@/contexts/StreakContext';
import type { ScheduleType, ProofType, VisualizationType } from '@/db/types';

const COLORS = ['#45645E', '#7BA1B0', '#D68C7A', '#3F6472', '#8B7355', '#6B5B73'];
const EMOJIS = ['🏃', '✍️', '🧘', '💧', '📚', '🎨', '🎵', '💪', '🧠', '🌱'];

export default function CreateStreakScreen() {
  const router = useRouter();
  const { refresh, setCreating } = useStreakContext();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🔥');
  const [color, setColor] = useState(COLORS[0]);
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [proofType, setProofType] = useState<ProofType>('media');
  const [visualizationType, setVisualizationType] =
    useState<VisualizationType>('counter_dots');
  const [targetDays, setTargetDays] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give your ritual a name.');
      return;
    }

    setCreating(true);
    try {
      await streakService.createStreak({
        name: name.trim(),
        description: description.trim() || undefined,
        emoji,
        color,
        scheduleType,
        proofType,
        visualizationType,
        targetDays: targetDays ? parseInt(targetDays, 10) : undefined,
      });

      await refresh();
      router.back();
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to create streak'
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>New Ritual</Text>
      <Text style={styles.subtitle}>
        Begin an intentional sequence of growth
      </Text>

      {/* Name */}
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Morning Run"
        placeholderTextColor="#9E9E9E"
      />

      {/* Description */}
      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Why does this ritual matter?"
        placeholderTextColor="#9E9E9E"
        multiline
      />

      {/* Emoji */}
      <Text style={styles.label}>Emoji</Text>
      <View style={styles.chipRow}>
        {EMOJIS.map((e) => (
          <Pressable
            key={e}
            style={[styles.emojiChip, emoji === e && styles.chipSelected]}
            onPress={() => setEmoji(e)}
          >
            <Text style={styles.emojiText}>{e}</Text>
          </Pressable>
        ))}
      </View>

      {/* Color */}
      <Text style={styles.label}>Color</Text>
      <View style={styles.chipRow}>
        {COLORS.map((c) => (
          <Pressable
            key={c}
            style={[
              styles.colorChip,
              { backgroundColor: c },
              color === c && styles.colorSelected,
            ]}
            onPress={() => setColor(c)}
          />
        ))}
      </View>

      {/* Schedule */}
      <Text style={styles.label}>Schedule</Text>
      <View style={styles.chipRow}>
        {(['daily', 'weekdays', 'interval'] as ScheduleType[]).map((s) => (
          <Pressable
            key={s}
            style={[styles.chip, scheduleType === s && styles.chipActive]}
            onPress={() => setScheduleType(s)}
          >
            <Text
              style={[
                styles.chipText,
                scheduleType === s && styles.chipTextActive,
              ]}
            >
              {s}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Proof Type */}
      <Text style={styles.label}>Proof Type</Text>
      <View style={styles.chipRow}>
        {(['media', 'reflection'] as ProofType[]).map((p) => (
          <Pressable
            key={p}
            style={[styles.chip, proofType === p && styles.chipActive]}
            onPress={() => setProofType(p)}
          >
            <Text
              style={[
                styles.chipText,
                proofType === p && styles.chipTextActive,
              ]}
            >
              {p === 'media' ? '📷 Media' : '✍️ Reflection'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Visualization */}
      <Text style={styles.label}>Visualization</Text>
      <View style={styles.chipRow}>
        {(['counter_dots', 'heatmap', 'ring'] as VisualizationType[]).map(
          (v) => (
            <Pressable
              key={v}
              style={[
                styles.chip,
                visualizationType === v && styles.chipActive,
              ]}
              onPress={() => setVisualizationType(v)}
            >
              <Text
                style={[
                  styles.chipText,
                  visualizationType === v && styles.chipTextActive,
                ]}
              >
                {v.replace('_', ' ')}
              </Text>
            </Pressable>
          )
        )}
      </View>

      {/* Target */}
      <Text style={styles.label}>Target days (optional)</Text>
      <TextInput
        style={styles.input}
        value={targetDays}
        onChangeText={setTargetDays}
        placeholder="e.g. 30"
        placeholderTextColor="#9E9E9E"
        keyboardType="number-pad"
      />

      {/* Submit */}
      <Pressable style={styles.createButton} onPress={handleCreate}>
        <Text style={styles.createButtonText}>Begin Ritual</Text>
      </Pressable>
    </ScrollView>
  );
}

const PRIMARY = '#45645E';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9F9' },
  content: { padding: 24, paddingBottom: 60 },

  title: { fontSize: 24, fontWeight: '700', color: '#2C3435', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#586162', marginTop: 4, marginBottom: 24 },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#586162',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C3435',
  },
  textArea: { height: 80, textAlignVertical: 'top' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: PRIMARY },
  chipText: { fontSize: 13, color: '#586162' },
  chipTextActive: { color: '#fff' },

  emojiChip: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipSelected: { backgroundColor: '#E8F5E9' },
  emojiText: { fontSize: 20 },

  colorChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#2C3435',
  },

  createButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

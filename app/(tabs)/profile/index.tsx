import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';

import { resetDatabase } from '@/db';
import { useStreakContext } from '@/contexts/StreakContext';

export default function ProfileScreen() {
  const { refresh } = useStreakContext();

  const handleResetDB = () => {
    Alert.alert(
      'Reset Database',
      'This will delete all data and re-seed. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetDatabase();
            await refresh();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <Pressable style={styles.row} onPress={() => {}}>
            <Text style={styles.rowLabel}>Reminders</Text>
            <Text style={styles.rowChevron}>→</Text>
          </Pressable>
          <Pressable style={styles.row} onPress={() => {}}>
            <Text style={styles.rowLabel}>Export Data</Text>
            <Text style={styles.rowChevron}>→</Text>
          </Pressable>
        </View>

        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Developer</Text>
            <Pressable style={styles.row} onPress={handleResetDB}>
              <Text style={[styles.rowLabel, { color: '#D32F2F' }]}>
                Reset Database
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9F9' },

  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#2C3435' },

  content: { padding: 16 },

  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#586162',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: { fontSize: 16, color: '#2C3435' },
  rowValue: { fontSize: 14, color: '#586162' },
  rowChevron: { fontSize: 16, color: '#586162' },
});

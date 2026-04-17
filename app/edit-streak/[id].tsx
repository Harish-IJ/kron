import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function EditStreakScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Ritual</Text>
      <Text style={styles.subtitle}>Streak ID: {id}</Text>
      <Text style={styles.placeholder}>
        Edit form will mirror Create Streak with pre-filled values.
        {'\n'}Coming in Phase 6.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9F9',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#2C3435' },
  subtitle: { fontSize: 14, color: '#586162', marginTop: 4 },
  placeholder: {
    fontSize: 14,
    color: '#586162',
    marginTop: 24,
    textAlign: 'center',
  },
});

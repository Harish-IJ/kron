import React, { useState } from 'react';
import { View, TextInput, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Typography } from '../ui/Typography';
import { PrimaryButton } from '../ui/PrimaryButton';
import { SecondaryButton } from '../ui/SecondaryButton';
import { RatingBadge } from '../ui/RatingBadge';
import { colors, space, borders } from '../../constants/theme';
import { pickImage, getAbsolutePath } from '../../services/media-service';
import type { Log, CreateLogInput, LogPatch } from '../../domain/types';

interface LogComposerProps {
  initial?: Partial<Log>;
  existingTimestamp?: string;
  onSave: (data: CreateLogInput | LogPatch) => Promise<void>;
  onCancel: () => void;
}

export function LogComposer({ initial, existingTimestamp, onSave, onCancel }: LogComposerProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [rating, setRating] = useState<1|2|3|4|5|null>(initial?.rating ?? null);
  const [mediaPath, setMediaPath] = useState<string | null>(initial?.mediaPath ?? null);
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    const uri = await pickImage();
    if (uri) setMediaPath(uri);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onSave({ title: title.trim(), description: description.trim() || null, rating, mediaPath, mediaType: mediaPath ? 'image' : null });
    } finally {
      setLoading(false);
    }
  };

  const imageUri = mediaPath
    ? (mediaPath.startsWith('media/') ? getAbsolutePath(mediaPath) : mediaPath)
    : null;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="LOG TITLE"
          placeholderTextColor={`${colors.ink}40`}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
        <TextInput
          style={styles.descInput}
          value={description}
          onChangeText={setDescription}
          placeholder="Description (optional)"
          placeholderTextColor={`${colors.navy}60`}
          multiline
          numberOfLines={4}
        />
        <View style={styles.section}>
          <Typography variant="caption" style={styles.sectionLabel}>RATING</Typography>
          <RatingBadge value={rating} onChange={setRating} />
        </View>
        <View style={styles.section}>
          <Typography variant="caption" style={styles.sectionLabel}>MEDIA</Typography>
          {imageUri ? (
            <View>
              <Image source={{ uri: imageUri }} style={styles.preview} contentFit="cover" />
              <Pressable onPress={() => setMediaPath(null)} style={{ paddingVertical: space[2] }}>
                <Typography variant="caption" color={colors.orange}>REMOVE IMAGE</Typography>
              </Pressable>
            </View>
          ) : (
            <SecondaryButton label="ADD IMAGE" onPress={handlePickImage} style={{ alignSelf: 'flex-start' }} />
          )}
        </View>
        {existingTimestamp && (
          <View style={styles.section}>
            <Typography variant="caption" style={styles.sectionLabel}>CREATED (IMMUTABLE)</Typography>
            <Typography variant="mono" color={`${colors.navy}80`}>{existingTimestamp}</Typography>
          </View>
        )}
        <View style={styles.actions}>
          <PrimaryButton label="SAVE LOG" onPress={handleSave} loading={loading} />
          <SecondaryButton label="CANCEL" onPress={onCancel} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1, backgroundColor: colors.base },
  content: { padding: space[5] },
  titleInput: { fontFamily: 'Inter-Bold', fontSize: 16, fontWeight: '700', color: colors.ink, borderBottomWidth: 1, borderBottomColor: colors.ink, paddingVertical: space[3], marginBottom: space[5] },
  descInput: { fontFamily: 'JetBrainsMono-Regular', fontSize: 12, color: colors.ink, borderWidth: 1, borderColor: colors.ink, padding: space[4], minHeight: 96, textAlignVertical: 'top', marginBottom: space[5] },
  section: { marginBottom: space[5] },
  sectionLabel: { marginBottom: space[2] },
  preview: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.navy, marginBottom: space[2] },
  actions: { gap: space[3], marginTop: space[3] },
});

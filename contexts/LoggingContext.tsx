import React, { createContext, useContext, useCallback, useRef, useState } from 'react';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';

interface LoggingState {
  streakId: string | null;
  proofType: 'media' | 'reflection' | null;
}

interface LoggingContextValue {
  /** Opens the bottom sheet for logging down a streak */
  openLoggingSheet: (streakId: string, proofType: 'media' | 'reflection') => void;
  /** Closes the bottom sheet */
  closeLoggingSheet: () => void;
  /** Access to current open context data if needed */
  currentLoggingTarget: LoggingState;
}

const LoggingContext = createContext<LoggingContextValue | null>(null);

export function useLoggingContext(): LoggingContextValue {
  const ctx = useContext(LoggingContext);
  if (!ctx) {
    throw new Error('useLoggingContext must be used within LoggingProvider');
  }
  return ctx;
}

export function LoggingProvider({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<LoggingState>({ streakId: null, proofType: null });
  const sheetRef = useRef<BottomSheet>(null);

  const openLoggingSheet = useCallback((streakId: string, proofType: 'media' | 'reflection') => {
    setTarget({ streakId, proofType });
    sheetRef.current?.snapToIndex(0);
  }, []);

  const closeLoggingSheet = useCallback(() => {
    sheetRef.current?.close();
  }, []);

  return (
    <LoggingContext.Provider value={{ openLoggingSheet, closeLoggingSheet, currentLoggingTarget: target }}>
      {children}
      {/* We pass sheetRef down to the actual BottomSheetComponent which resides at the RootLayout level */}
      <LoggingSheetRenderer sheetRef={sheetRef} target={target} closeLoggingSheet={closeLoggingSheet} />
    </LoggingContext.Provider>
  );
}

// Separated into a different component so it doesn't cause context re-renders down the tree
import { View, Text, StyleSheet, Pressable, TextInput, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useStreakContext } from './StreakContext';
import * as streakService from '@/services/streakService';
import * as mediaService from '@/services/mediaService';

function LoggingSheetRenderer({
  sheetRef,
  target,
  closeLoggingSheet
}: {
  sheetRef: React.RefObject<BottomSheet>;
  target: LoggingState;
  closeLoggingSheet: () => void;
}) {
  const { refresh } = useStreakContext();
  const [note, setNote] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clean local state when sheet closes
  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        setNote('');
        setMediaUri(null);
        setIsSubmitting(false);
      }
    },
    []
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    []
  );

  const handlePickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Temporarily store the URI in component state
      setMediaUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!target.streakId) return;
    setIsSubmitting(true);

    try {
      // 1. Process media if any
      let finalMediaUri = null;
      if (mediaUri) {
        finalMediaUri = await mediaService.saveMediaItem(mediaUri);
      }

      // 2. Perform DB mutation (DB-first approach)
      await streakService.createLog({
        streakId: target.streakId,
        status: 'achieved',
        note: note.trim() || undefined,
        // Phase 6 addition: pass media references down to service
        mediaPaths: finalMediaUri ? [finalMediaUri] : undefined 
      });

      // 3. Refresh context for UI update
      await refresh();
      closeLoggingSheet();
    } catch (err) {
      console.error('[Kron] Log submission failed:', err);
      alert('Failed to save log.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['65%', '90%']}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      backgroundStyle={styles.sheetBackground}
    >
      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          {target.proofType === 'media' ? 'Share Your Proof' : 'Reflection Entry'}
        </Text>
        
        {target.proofType === 'media' && (
          <Pressable 
            style={[styles.mediaPlaceholder, mediaUri && styles.mediaPlaceholderFilled]} 
            onPress={handlePickMedia}
          >
            {mediaUri ? (
              <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
            ) : (
              <Text style={styles.mediaPlaceholderText}>Tap to select Photo/Video</Text>
            )}
          </Pressable>
        )}

        <Text style={styles.label}>Note (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="How did it go?"
          placeholderTextColor="#9E9E9E"
          value={note}
          onChangeText={setNote}
          multiline
        />

        <Pressable 
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting || (target.proofType === 'media' && !mediaUri && !note)}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Save Entry</Text>
          )}
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const PRIMARY = '#45645E';

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#F8F9F9',
  },
  contentContainer: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3435',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#586162',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  mediaPlaceholder: {
    height: 200,
    backgroundColor: '#EBEBEB',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderStyle: 'dashed',
  },
  mediaPlaceholderFilled: {
    borderStyle: 'solid',
    borderColor: 'transparent',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mediaPlaceholderText: {
    color: '#586162',
    fontSize: 16,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

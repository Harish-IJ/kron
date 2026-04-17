import React, { createContext, useContext, useCallback, useRef, useState, useEffect, useMemo } from 'react';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';

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
    console.log('[Kron] openLoggingSheet triggered for', streakId);
    console.log('[Kron] sheetRef.current is present?', !!sheetRef.current);
    setTarget({ streakId, proofType });
    setTimeout(() => {
      sheetRef.current?.snapToIndex(0);
    }, 100);
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
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, ScrollView, ImageBackground, Image, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useStreakContext } from './StreakContext';
import * as streakService from '@/services/streakService';
import * as mediaService from '@/services/mediaService';
import { COLORS, TYPOGRAPHY, SHADOWS, RADII } from '@/constants/theme';

function LoggingSheetRenderer({
  sheetRef,
  target,
  closeLoggingSheet
}: {
  sheetRef: React.RefObject<BottomSheet>;
  target: LoggingState;
  closeLoggingSheet: () => void;
}) {
  const { streakCards, refresh } = useStreakContext();
  const [note, setNote] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'achieved' | 'not_achieved'>('achieved');
  const [selectedStreakId, setSelectedStreakId] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Auto-sync selected streak from props
  useEffect(() => {
    if (target.streakId) {
      setSelectedStreakId(target.streakId);
    } else if (streakCards.length > 0) {
      setSelectedStreakId(streakCards[0].streak.id);
    }
  }, [target.streakId, streakCards]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        setNote('');
        setMediaUri(null);
        setIsSubmitting(false);
        setStatus('achieved');
      }
    },
    []
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
    ),
    []
  );
  const handlePickMedia = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        alert("Camera permission is required to capture proof.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        console.log('[Kron] Picked URI:', pickedUri);
        
        // Save immediately to internal storage as requested
        const savedUri = await mediaService.saveMediaItem(pickedUri);
        console.log('[Kron] Saved internal URI for preview:', savedUri);
        setMediaUri(savedUri);
      }
    } catch (err) {
      console.error('[Kron] Camera error:', err);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStreakId) return;
    setIsSubmitting(true);

    try {
      let finalMediaUri = mediaUri;

      await streakService.createLog({
        streakId: selectedStreakId,
        status: status,
        note: note.trim() || undefined,
        mediaPaths: finalMediaUri ? [finalMediaUri] : undefined 
      });

      await refresh();
      closeLoggingSheet();
    } catch (err) {
      console.error('[Kron] Log submission failed:', err);
      alert('Failed to save log.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom glass background
  const CustomBackground = useCallback(
    ({ style }: { style: any }) => (
      <BlurView
        intensity={20}
        tint="light"
        style={[style, { overflow: 'hidden', borderRadius: 24, backgroundColor: 'rgba(248, 249, 249, 0.7)' }]}
      />
    ),
  []);

  const snapPoints = useMemo(() => ['85%', '95%'], []);

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      backgroundComponent={CustomBackground}
      handleIndicatorStyle={{ backgroundColor: COLORS.onSurfaceVariant }}
    >
      <BottomSheetScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.headerBox}>
          <Text style={styles.headerLabel}>Journal Entry</Text>
          <Text style={styles.headerTitle}>Log Proof</Text>
        </View>

        {/* Streak Selector Popup */}
        <View style={{ marginBottom: 24 }}>
          <Pressable 
            onPress={() => setIsPickerOpen(!isPickerOpen)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.surfaceContainerLow, borderRadius: RADII.lg, borderWidth: 1, borderColor: isPickerOpen ? COLORS.primary : 'transparent' }}
          >
            <Text style={{ fontSize: 16, color: COLORS.onSurfaceVariant, fontWeight: '500' }}>
              {selectedStreakId 
                 ? `${streakCards.find(s => s.streak.id === selectedStreakId)?.streak.emoji}  ${streakCards.find(s => s.streak.id === selectedStreakId)?.streak.name}` 
                 : 'Select a ritual'}
            </Text>
            <MaterialIcons name={isPickerOpen ? "arrow-drop-up" : "arrow-drop-down"} size={24} color={COLORS.onSurfaceVariant} />
          </Pressable>

          {isPickerOpen && (
            <View style={{ marginTop: 8, backgroundColor: COLORS.surfaceContainerLowest, borderRadius: RADII.lg, borderWidth: 1, borderColor: COLORS.surfaceContainerLow, overflow: 'hidden' }}>
              {streakCards.map(s => (
                <Pressable 
                  key={s.streak.id}
                  onPress={() => {
                    setSelectedStreakId(s.streak.id);
                    setIsPickerOpen(false);
                  }}
                  style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceContainerLow, backgroundColor: selectedStreakId === s.streak.id ? COLORS.primaryContainer : 'transparent' }}
                >
                  <Text style={{ fontSize: 16, color: selectedStreakId === s.streak.id ? COLORS.onPrimaryContainer : COLORS.onSurface, fontWeight: selectedStreakId === s.streak.id ? '600' : '400' }}>
                    {s.streak.emoji}  {s.streak.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Achievement Toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleContainer}>
             <Pressable style={[styles.toggleBtn, status === 'achieved' && styles.toggleBtnActiveA]} onPress={() => setStatus('achieved')}>
                <Text style={[styles.toggleBtnText, status === 'achieved' && styles.toggleBtnTextActive]}>Achieved</Text>
             </Pressable>
             <Pressable style={[styles.toggleBtn, status === 'not_achieved' && styles.toggleBtnActiveN]} onPress={() => setStatus('not_achieved')}>
                <Text style={[styles.toggleBtnText, status === 'not_achieved' && styles.toggleBtnTextActiveN]}>Not Achieved</Text>
             </Pressable>
          </View>
        </View>

        {/* Camera action */}
        <View style={[styles.mediaSection, { borderWidth: 2, borderColor: 'blue' }]}>
           {mediaUri ? (
              <Pressable 
                onPress={handlePickMedia} 
                style={[styles.mediaPreviewFull, { width: Dimensions.get('window').width - 48, height: 300, backgroundColor: 'green', borderWidth: 5, borderColor: 'red' }]}
              >
                <Image 
                  key={mediaUri}
                  source={{ uri: mediaUri }} 
                  style={{ width: '100%', height: '100%' }} 
                  resizeMode="cover"
                  onLoad={() => console.log('[Kron] Preview Image component LOADED')}
                  onError={(e) => console.log('[Kron] Preview Image component ERROR:', e.nativeEvent.error)}
                />
             </Pressable>
           ) : (
             <Pressable onPress={handlePickMedia} style={styles.cameraBox}>
               <View style={styles.cameraIconWrap}>
                 <MaterialIcons name="photo-camera" size={32} color={COLORS.primary} />
               </View>
               <Text style={styles.cameraText}>Open Camera</Text>
             </Pressable>
           )}
        </View>

        {/* Notes */}
        <View style={styles.notesSection}>
           <Text style={styles.notesLabel}>Optional Notes</Text>
           <TextInput
              style={styles.notesInput}
              placeholder="Reflect on today's ritual..."
              placeholderTextColor="rgba(88, 97, 98, 0.4)"
              value={note}
              onChangeText={setNote}
              multiline
           />
        </View>

        {/* Footer Actions */}
        <View style={styles.footerRow}>
          <Pressable style={styles.completeBtn} onPress={handleSubmit} disabled={isSubmitting || !selectedStreakId}>
             {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.completeBtnText}>Complete Ritual</Text>}
          </Pressable>
          <Pressable style={styles.closeBtn} onPress={closeLoggingSheet}>
             <MaterialIcons name="close" size={24} color={COLORS.onSurfaceVariant} />
          </Pressable>
        </View>
        <View style={{height: 48}} />
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetContent: { flex: 1, paddingHorizontal: 24, paddingBottom: 48 },
  headerBox: { marginBottom: 24, alignItems: 'center' },
  headerLabel: { fontSize: 11, letterSpacing: 0.5, color: COLORS.onSurfaceVariant, textTransform: 'uppercase', marginBottom: 4 },
  headerTitle: { ...TYPOGRAPHY.displaySm, color: COLORS.onSurface },
  
  streakScrollRow: { gap: 8, paddingBottom: 24, paddingHorizontal: 4 },
  streakPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADII.full, backgroundColor: COLORS.surfaceContainerLow, borderWidth: 1, borderColor: 'transparent' },
  streakPillActive: { backgroundColor: COLORS.primaryContainer, borderColor: COLORS.primary },
  streakPillText: { fontSize: 14, color: COLORS.onSurfaceVariant, fontWeight: '500' },
  streakPillTextActive: { color: COLORS.onPrimaryContainer, fontWeight: '700' },

  toggleRow: { alignItems: 'center', marginBottom: 32 },
  toggleContainer: { flexDirection: 'row', backgroundColor: COLORS.surfaceContainerLow, borderRadius: RADII.full, padding: 4 },
  toggleBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: RADII.full, backgroundColor: 'transparent' },
  toggleBtnActiveA: { backgroundColor: COLORS.primary },
  toggleBtnActiveN: { backgroundColor: COLORS.surfaceContainerHighest },
  toggleBtnText: { ...TYPOGRAPHY.labelSm, color: COLORS.onSurfaceVariant, fontWeight: '600' },
  toggleBtnTextActive: { color: COLORS.onPrimary },
  toggleBtnTextActiveN: { color: COLORS.onSurface },

  mediaSection: { marginBottom: 24 },
  cameraBox: { width: '100%', alignItems: 'center', gap: 12, paddingVertical: 48, borderRadius: RADII.lg, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(171, 180, 181, 0.3)', backgroundColor: COLORS.surfaceContainerLowest },
  cameraIconWrap: { width: 56, height: 56, borderRadius: RADII.full, backgroundColor: COLORS.primaryContainer, justifyContent: 'center', alignItems: 'center' },
  cameraText: { ...TYPOGRAPHY.labelSm, color: COLORS.onSurfaceVariant },
  mediaPreviewFull: { width: '100%', height: 300, borderRadius: RADII.md, overflow: 'hidden', backgroundColor: COLORS.surfaceContainerHighest },
  mediaImage: { width: '100%', height: '100%' },

  notesSection: { marginBottom: 32 },
  notesLabel: { fontSize: 11, color: COLORS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 6, marginBottom: 8 },
  notesInput: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: RADII.lg, fontSize: 16, color: COLORS.onSurface, padding: 20, height: 100, textAlignVertical: 'top' },

  footerRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  completeBtn: { flex: 1, paddingVertical: 18, backgroundColor: COLORS.primary, borderRadius: RADII.full, alignItems: 'center', ...SHADOWS.floating },
  completeBtnText: { ...TYPOGRAPHY.bodyLg, color: COLORS.onPrimary, fontWeight: '700' },
  closeBtn: { padding: 16, paddingHorizontal: 20, backgroundColor: COLORS.surfaceContainerLow, borderRadius: RADII.full },
});

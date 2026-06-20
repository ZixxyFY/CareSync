// src/screens/Medical/OCRscanner.tsx
/**
 * @file OCRscanner.tsx
 * @description Prescription Scanner screen — the OCR feature of CareSync.
 *
 * SOLID Principle: Single Responsibility — this screen manages ONLY the
 * multi-step scanner UI flow (pick image → loading → verify → save).
 * It has ZERO parsing logic; all OCR logic lives in ocrService.tsx via MedicalContext.
 * All persistence is handled by MedicalContext → medicalService → Supabase.
 *
 * Feature Flow:
 *   1. User taps "Pick from Gallery" or "Use Camera" → expo-image-picker
 *   2. Image URI is sent to MedicalContext.scanPrescription()
 *   3. AI processing state is shown with animated steps
 *   4. Parsed data is displayed in an editable verification form
 *   5. User confirms/edits → taps "Save Record" → stored in Supabase via MedicalContext
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useMedical } from '../../context/MedicalContext';
import { MedicalRecord } from '../../context/MedicalContext';
import { ParsedMedication } from '../../services/ocrService';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { isGeminiConfigured } from '../../config/ai';
import CustomButton from '../../components/CustomButton';

// ---------------------------------------------------------------------------
// SUB-COMPONENTS (SRP — each only renders its own section)
// ---------------------------------------------------------------------------

/**
 * MedicationRow — An editable row for a single parsed medication.
 */
const MedicationRow = ({
  item,
  index,
  onUpdate,
}: {
  item: ParsedMedication;
  index: number;
  onUpdate: (index: number, field: keyof ParsedMedication, value: string) => void;
}) => (
  <View style={styles.medRow}>
    <View style={styles.medIndexBadge}>
      <Text style={styles.medIndexText}>{index + 1}</Text>
    </View>
    <View style={styles.medFields}>
      <View style={styles.medFieldRow}>
        <Ionicons name="medical-outline" size={14} color={COLORS.primary} />
        <TextInput
          style={styles.medInput}
          value={item.medication}
          onChangeText={(v) => onUpdate(index, 'medication', v)}
          placeholder="Medication name"
          placeholderTextColor={COLORS.textLight}
        />
      </View>
      <View style={styles.medFieldRow}>
        <Ionicons name="fitness-outline" size={14} color={COLORS.success} />
        <TextInput
          style={styles.medInput}
          value={item.dosage}
          onChangeText={(v) => onUpdate(index, 'dosage', v)}
          placeholder="Dosage"
          placeholderTextColor={COLORS.textLight}
        />
      </View>
      <View style={styles.medFieldRow}>
        <Ionicons name="time-outline" size={14} color={COLORS.warning} />
        <TextInput
          style={styles.medInput}
          value={item.frequency}
          onChangeText={(v) => onUpdate(index, 'frequency', v)}
          placeholder="Frequency"
          placeholderTextColor={COLORS.textLight}
        />
      </View>
      {item.duration && (
        <View style={styles.medFieldRow}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textLight} />
          <TextInput
            style={styles.medInput}
            value={item.duration}
            onChangeText={(v) => onUpdate(index, 'duration', v)}
            placeholder="Duration"
            placeholderTextColor={COLORS.textLight}
          />
        </View>
      )}
      {item.instructions && (
        <View style={[styles.medFieldRow, styles.instructionRow]}>
          <Ionicons name="information-circle-outline" size={14} color={COLORS.textLight} />
          <Text style={styles.instructionText}>{item.instructions}</Text>
        </View>
      )}
    </View>
  </View>
);

// ---------------------------------------------------------------------------
// SAVED RECORD CARD
// ---------------------------------------------------------------------------

interface RecordCardProps {
  record: MedicalRecord;
  onDelete: (id: string) => void;
}

const RecordCard = ({ record, onDelete }: RecordCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(record.savedAt);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const toggleExpand = () => {
    if (!expanded) {
      setExpanded(true);
      Animated.spring(slideAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setExpanded(false));
    }
  };

  return (
    <View style={styles.recordCard}>
      <TouchableOpacity
        style={styles.recordCardHeader}
        onPress={toggleExpand}
        activeOpacity={0.8}
      >
        <View style={styles.recordDateBadge}>
          <Text style={styles.recordDateDay}>{date.getDate()}</Text>
          <Text style={styles.recordDateMonth}>
            {date.toLocaleString('default', { month: 'short' }).toUpperCase()}
          </Text>
        </View>
        <View style={styles.recordCardBody}>
          <Text style={styles.recordDoctor} numberOfLines={1}>
            {record.prescribedBy ?? 'Unknown Doctor'}
          </Text>
          <Text style={styles.recordMedCount}>
            {record.medications.length} medication{record.medications.length !== 1 ? 's' : ''}
          </Text>
          {record.confidence !== undefined && (
            <View
              style={[
                styles.confidencePill,
                { backgroundColor: record.confidence > 0.9 ? '#D1FAE5' : '#FEF3C7' },
              ]}
            >
              <Text
                style={[
                  styles.confidenceText,
                  { color: record.confidence > 0.9 ? COLORS.success : COLORS.warning },
                ]}
              >
                {Math.round(record.confidence * 100)}% confidence
              </Text>
            </View>
          )}
        </View>
        <View style={styles.recordActions}>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() =>
              Alert.alert('Delete Record?', 'This will permanently remove this prescription.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => onDelete(record.id) },
              ])
            }
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
          </TouchableOpacity>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={COLORS.textLight}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <Animated.View
          style={[
            styles.recordExpanded,
            {
              opacity: slideAnim,
              transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
            },
          ]}
        >
          {record.patientName ? (
            <Text style={styles.recordMeta}>
              <Ionicons name="person-outline" size={13} /> Patient: {record.patientName}
            </Text>
          ) : null}
          {record.prescribedDate ? (
            <Text style={styles.recordMeta}>
              <Ionicons name="calendar-outline" size={13} /> Date: {record.prescribedDate}
            </Text>
          ) : null}
          {record.medications.map((med, i) => (
            <View key={i} style={styles.medSummaryRow}>
              <View style={styles.medDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.medSummaryName}>{med.medication}</Text>
                <Text style={styles.medSummaryDetail}>
                  {med.dosage} · {med.frequency}
                  {med.duration ? ` · ${med.duration}` : ''}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>
      )}
    </View>
  );
};

// ---------------------------------------------------------------------------
// ANIMATED PROCESSING STEP
// ---------------------------------------------------------------------------

const ProcessingStep = ({ label, delay }: { label: string; delay: number }) => {
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.spring(checkAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.processingStep}>
      <Animated.View
        style={[
          styles.processingStepIcon,
          { transform: [{ scale: checkAnim }], opacity: checkAnim },
        ]}
      >
        <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
      </Animated.View>
      <Text style={styles.processingStepText}>{label}</Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// MAIN SCREEN
// ---------------------------------------------------------------------------

export default function OCRScanner(): React.JSX.Element {
  const { state, loadRecords, scanPrescription, saveVerifiedRecord, clearPending, deleteRecord } =
    useMedical();

  // Local verification form state (editable copy of OCR results)
  const [editedMeds, setEditedMeds] = useState<ParsedMedication[]>([]);
  const [verificationStarted, setVerificationStarted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Hero pulse animation
  const scanPulse = useRef(new Animated.Value(1)).current;
  const scanRingOpacity = useRef(new Animated.Value(0)).current;

  const geminiActive = isGeminiConfigured();

  // Load persisted records on mount
  useEffect(() => {
    loadRecords();

    // Pulse animation for scan icon
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scanPulse, { toValue: 1.1, duration: 1200, useNativeDriver: true }),
          Animated.timing(scanRingOpacity, { toValue: 0.6, duration: 600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scanPulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(scanRingOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, []);

  // ---------------------------------------------------------------------------
  // IMAGE PICKER
  // ---------------------------------------------------------------------------

  const requestMediaPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'CareSync needs access to your photo library to scan prescriptions.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'CareSync needs camera access to capture prescriptions.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const handlePickFromGallery = useCallback(async (): Promise<void> => {
    const hasPermission = await requestMediaPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
      base64: true,
    });

    if (!result.canceled && result.assets[0].uri) {
      await triggerOCR(result.assets[0].uri, result.assets[0].base64 ?? undefined);
    }
  }, [triggerOCR]);

  const handleCapture = useCallback(async (): Promise<void> => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
      base64: true,
    });

    if (!result.canceled && result.assets[0].uri) {
      await triggerOCR(result.assets[0].uri, result.assets[0].base64 ?? undefined);
    }
  }, [triggerOCR]);

  const triggerOCR = useCallback(
    async (uri: string, base64?: string): Promise<void> => {
      setVerificationStarted(false);
      try {
        await scanPrescription(uri, base64);
        setVerificationStarted(true);
      } catch (err: any) {
        Alert.alert(
          'Scan Failed',
          `Could not process the image.\n\n${err?.message ?? 'Please try a clearer photo.'}`
        );
      }
    },
    [scanPrescription]
  );

  // Initialize editable medications when OCR result arrives
  useEffect(() => {
    if (state.pendingOCRResult && verificationStarted) {
      setEditedMeds([...state.pendingOCRResult.medications]);
    }
  }, [state.pendingOCRResult, verificationStarted]);

  // ---------------------------------------------------------------------------
  // MEDICATION EDITING
  // ---------------------------------------------------------------------------

  const handleUpdateMed = useCallback(
    (index: number, field: keyof ParsedMedication, value: string): void => {
      setEditedMeds((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    []
  );

  // ---------------------------------------------------------------------------
  // SAVE RECORD
  // ---------------------------------------------------------------------------

  const handleSaveRecord = useCallback(async (): Promise<void> => {
    if (!state.scannedImageUri || !state.pendingOCRResult) return;

    setIsSaving(true);
    try {
      await saveVerifiedRecord(
        state.scannedImageUri,
        editedMeds,
        {
          patientName: state.pendingOCRResult.patientName,
          prescribedBy: state.pendingOCRResult.prescribedBy,
          prescribedDate: state.pendingOCRResult.prescribedDate,
          confidence: state.pendingOCRResult.confidence,
        }
      );
      setVerificationStarted(false);
      setEditedMeds([]);
      Alert.alert(
        '✅ Record Saved!',
        `${editedMeds.length} medication(s) have been digitized and saved to your medical records.`,
        [{ text: 'Great!' }]
      );
    } catch {
      Alert.alert('Save Failed', 'Could not save the record. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [state, editedMeds, saveVerifiedRecord]);

  const handleCancel = useCallback((): void => {
    clearPending();
    setVerificationStarted(false);
    setEditedMeds([]);
  }, [clearPending]);

  const handleDeleteRecord = useCallback(
    (id: string): void => {
      deleteRecord(id);
    },
    [deleteRecord]
  );

  // ---------------------------------------------------------------------------
  // RENDER — PROCESSING STATE
  // ---------------------------------------------------------------------------

  if (state.isProcessing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.gradientStart} />
        <View style={styles.processingContainer}>
          {/* Dark gradient header */}
          <View style={styles.processingHeader}>
            <View style={styles.processingHeaderDecor1} />
            <View style={styles.processingHeaderDecor2} />
            <View style={styles.processingBrainIcon}>
              <Ionicons name="analytics" size={32} color={COLORS.surface} />
            </View>
            <Text style={styles.processingHeaderTitle}>AI Analyzing</Text>
            <Text style={styles.processingHeaderSub}>Gemini Vision is reading your prescription</Text>
          </View>

          <View style={styles.processingCard}>
            {state.scannedImageUri && (
              <Image
                source={{ uri: state.scannedImageUri }}
                style={styles.processingThumb}
              />
            )}

            <View style={styles.processingSpinnerRow}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.processingTitle}>Extracting medication data...</Text>
            </View>

            <View style={styles.processingSteps}>
              <ProcessingStep label="Detecting text regions" delay={300} />
              <ProcessingStep label="Identifying medications & dosages" delay={1200} />
              <ProcessingStep label="Structuring prescription data" delay={2400} />
            </View>

            <View style={styles.processingFootnote}>
              <Ionicons name="sparkles-outline" size={14} color={COLORS.primary} />
              <Text style={styles.processingFootnoteText}>
                Powered by Google Gemini 2.0 Flash
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER — VERIFICATION FORM STATE
  // ---------------------------------------------------------------------------

  if (state.pendingOCRResult && verificationStarted && editedMeds.length > 0) {
    const result = state.pendingOCRResult;
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── HEADER ── */}
          <View style={styles.verifyHeaderBg}>
            <View style={styles.verifyHeader}>
              <View>
                <Text style={styles.verifyTitle}>Verify Prescription</Text>
                <Text style={styles.verifySubtitle}>
                  Review and correct the AI extraction before saving
                </Text>
              </View>
              <View
                style={[
                  styles.confidenceBadge,
                  { backgroundColor: result.confidence > 0.7 ? '#D1FAE5' : '#FEF3C7' },
                ]}
              >
                <Ionicons
                  name={result.confidence > 0.7 ? 'checkmark-circle' : 'alert-circle'}
                  size={13}
                  color={result.confidence > 0.7 ? COLORS.success : COLORS.warning}
                />
                <Text
                  style={[
                    styles.confidenceText,
                    { color: result.confidence > 0.7 ? COLORS.success : COLORS.warning },
                  ]}
                >
                  {Math.round(result.confidence * 100)}%
                </Text>
              </View>
            </View>
          </View>

          {/* ── SCANNED IMAGE PREVIEW ── */}
          {state.scannedImageUri && (
            <Image source={{ uri: state.scannedImageUri }} style={styles.imagePreview} />
          )}

          {/* ── PRESCRIPTION META ── */}
          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <View style={styles.metaIconWrap}>
                <Ionicons name="person-outline" size={14} color={COLORS.primary} />
              </View>
              <Text style={styles.metaLabel}>Patient</Text>
              <Text style={styles.metaValue}>{result.patientName ?? '—'}</Text>
            </View>
            <View style={[styles.metaRow, { borderTopWidth: 1, borderTopColor: COLORS.border }]}>
              <View style={styles.metaIconWrap}>
                <Ionicons name="medical-outline" size={14} color={COLORS.primary} />
              </View>
              <Text style={styles.metaLabel}>Doctor</Text>
              <Text style={styles.metaValue}>{result.prescribedBy ?? '—'}</Text>
            </View>
            <View style={[styles.metaRow, { borderTopWidth: 1, borderTopColor: COLORS.border }]}>
              <View style={styles.metaIconWrap}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
              </View>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{result.prescribedDate ?? '—'}</Text>
            </View>
          </View>

          {/* ── EXTRACTED MEDICATIONS ── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>
              Extracted Medications
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{editedMeds.length}</Text>
            </View>
          </View>
          <Text style={styles.editHint}>
            <Ionicons name="create-outline" size={13} /> Tap any field to correct AI errors
          </Text>
          {editedMeds.map((med, idx) => (
            <View key={idx} style={styles.medCard}>
              <MedicationRow item={med} index={idx} onUpdate={handleUpdateMed} />
            </View>
          ))}

          {/* ── RAW TEXT ── */}
          <TouchableOpacity
            style={styles.rawTextToggle}
            onPress={() =>
              Alert.alert('Raw Extracted Text', result.rawText, [{ text: 'Close' }])
            }
          >
            <Ionicons name="document-text-outline" size={16} color={COLORS.primary} />
            <Text style={styles.rawTextLabel}>View Raw Extracted Text</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
          </TouchableOpacity>

          {/* ── ACTIONS ── */}
          <CustomButton
            title="Save to Medical Records"
            onPress={handleSaveRecord}
            loading={isSaving || state.isSaving}
          />
          <CustomButton
            title="Discard & Rescan"
            variant="outline"
            onPress={handleCancel}
            disabled={isSaving || state.isSaving}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER — IDLE STATE (SCANNER LANDING)
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.gradientStart} />
      <ScrollView
        contentContainerStyle={styles.scrollContentIdle}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO SECTION ── */}
        <View style={styles.hero}>
          <View style={styles.heroDecor1} />
          <View style={styles.heroDecor2} />

          {/* Animated scan icon with pulsing ring */}
          <View style={styles.heroIconWrapper}>
            <Animated.View
              style={[
                styles.heroRing,
                { opacity: scanRingOpacity, transform: [{ scale: scanPulse }] },
              ]}
            />
            <Animated.View
              style={[styles.heroIcon, { transform: [{ scale: scanPulse }] }]}
            >
              <Ionicons name="scan" size={44} color={COLORS.surface} />
            </Animated.View>
          </View>

          <Text style={styles.heroTitle}>Prescription Scanner</Text>
          <Text style={styles.heroSubtitle}>
            AI-powered OCR extracts medications, dosages & frequencies instantly from your prescription photos.
          </Text>

          {/* Live OCR Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: geminiActive ? '#D1FAE5' : '#FEF3C7' }]}>
            <View style={[styles.statusDot, { backgroundColor: geminiActive ? COLORS.success : COLORS.warning }]} />
            <Text style={[styles.statusText, { color: geminiActive ? COLORS.success : '#92400E' }]}>
              {geminiActive ? '🟢 Gemini OCR Active' : '🟡 Demo Mode — Add API Key'}
            </Text>
          </View>
        </View>

        {/* ── SCAN BUTTONS ── */}
        <View style={styles.scanActions}>
          <TouchableOpacity style={styles.scanCard} onPress={handleCapture} activeOpacity={0.8}>
            <View style={[styles.scanCardIcon, { backgroundColor: COLORS.primaryTint }]}>
              <Ionicons name="camera" size={30} color={COLORS.primary} />
            </View>
            <Text style={styles.scanCardTitle}>Take Photo</Text>
            <Text style={styles.scanCardSubtitle}>Capture with camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.scanCard} onPress={handlePickFromGallery} activeOpacity={0.8}>
            <View style={[styles.scanCardIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="images" size={30} color={COLORS.success} />
            </View>
            <Text style={styles.scanCardTitle}>From Gallery</Text>
            <Text style={styles.scanCardSubtitle}>Choose saved photo</Text>
          </TouchableOpacity>
        </View>

        {/* ── HOW IT WORKS ── */}
        <Text style={styles.sectionLabel}>How It Works</Text>
        {[
          { step: '1', icon: 'image-outline' as const, title: 'Capture or Upload', body: 'Take a photo or select one from your gallery.' },
          { step: '2', icon: 'analytics-outline' as const, title: 'AI Parses Data', body: 'Gemini Vision extracts all medications, dosages & frequencies.' },
          { step: '3', icon: 'create-outline' as const, title: 'Verify & Confirm', body: 'Review AI results and correct any errors before saving.' },
          { step: '4', icon: 'cloud-done-outline' as const, title: 'Saved to Records', body: 'Digitized prescriptions are saved to your medical records.' },
        ].map((item) => (
          <View key={item.step} style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{item.step}</Text>
            </View>
            <View style={[styles.stepIconWrap, { backgroundColor: COLORS.primaryTint }]}>
              <Ionicons name={item.icon} size={18} color={COLORS.primary} />
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>{item.title}</Text>
              <Text style={styles.stepDescription}>{item.body}</Text>
            </View>
          </View>
        ))}

        {/* ── SAVED RECORDS ── */}
        {state.isLoadingRecords ? (
          <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.primary} />
        ) : state.records.length > 0 ? (
          <View style={{ marginTop: 24 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>
                Saved Records
              </Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{state.records.length}</Text>
              </View>
            </View>
            {state.records.map((record) => (
              <RecordCard key={record.id} record={record} onDelete={handleDeleteRecord} />
            ))}
          </View>
        ) : (
          <View style={styles.savedBanner}>
            <Ionicons name="folder-open-outline" size={22} color={COLORS.primary} />
            <Text style={styles.savedBannerText}>
              No prescriptions saved yet. Scan your first one above!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SIZES.padding, paddingBottom: 40 },
  scrollContentIdle: { paddingBottom: 40 },

  // ── PROCESSING STATE ──
  processingContainer: { flex: 1, backgroundColor: COLORS.gradientStart },
  processingHeader: {
    backgroundColor: COLORS.gradientStart,
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 48,
    overflow: 'hidden',
    position: 'relative',
  },
  processingHeaderDecor1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -60,
    right: -50,
  },
  processingHeaderDecor2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -40,
    left: -30,
  },
  processingBrainIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  processingHeaderTitle: {
    fontSize: FONTS.h2,
    fontWeight: '800',
    color: COLORS.surface,
    letterSpacing: -0.5,
  },
  processingHeaderSub: {
    fontSize: FONTS.caption,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  processingCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flex: 1,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.modal,
  },
  processingThumb: {
    width: '100%',
    height: 160,
    borderRadius: SIZES.borderRadius,
    marginBottom: 20,
    backgroundColor: COLORS.border,
  },
  processingSpinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  processingTitle: {
    fontSize: FONTS.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  processingSteps: {
    alignSelf: 'stretch',
    gap: 12,
    marginBottom: 20,
  },
  processingStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  processingStepIcon: { width: 18, height: 18 },
  processingStepText: { fontSize: FONTS.caption, color: COLORS.textLight },
  processingFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  processingFootnoteText: {
    fontSize: FONTS.micro,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // ── HERO (IDLE) ──
  hero: {
    backgroundColor: COLORS.gradientStart,
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: SIZES.padding,
    overflow: 'hidden',
    position: 'relative',
  },
  heroDecor1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -80,
    right: -60,
  },
  heroDecor2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -50,
    left: -40,
  },
  heroIconWrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  heroIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: FONTS.h1,
    fontWeight: '800',
    color: COLORS.surface,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: FONTS.caption,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: SIZES.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: FONTS.micro, fontWeight: '700' },

  // ── SCAN BUTTONS ──
  scanActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 20,
  },
  scanCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: 18,
    alignItems: 'center',
    ...SHADOWS.cardStrong,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  scanCardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  scanCardTitle: { fontSize: FONTS.body, fontWeight: '700', color: COLORS.text },
  scanCardSubtitle: { fontSize: FONTS.micro, color: COLORS.textLight, textAlign: 'center', marginTop: 4 },

  // ── SECTION LABELS ──
  sectionLabel: {
    fontSize: FONTS.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: SIZES.padding,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: SIZES.padding,
    marginBottom: 10,
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: { fontSize: FONTS.micro, color: COLORS.surface, fontWeight: '800' },

  // ── HOW IT WORKS ──
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: 14,
    marginBottom: 8,
    marginHorizontal: SIZES.padding,
    gap: 12,
    ...SHADOWS.card,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: { fontSize: FONTS.micro, color: COLORS.surface, fontWeight: '800' },
  stepIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: FONTS.caption, fontWeight: '700', color: COLORS.text },
  stepDescription: { fontSize: FONTS.micro, color: COLORS.textLight, marginTop: 2 },

  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.primaryTint,
    borderRadius: SIZES.borderRadius,
    padding: 16,
    marginTop: 12,
    marginHorizontal: SIZES.padding,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.card,
  },
  savedBannerText: { fontSize: FONTS.caption, color: COLORS.primaryDark, flex: 1, fontWeight: '500' },

  // ── VERIFICATION STATE ──
  verifyHeaderBg: {
    backgroundColor: COLORS.gradientStart,
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: SIZES.padding,
    marginBottom: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  verifyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  verifyTitle: { fontSize: FONTS.h2, fontWeight: '800', color: COLORS.surface },
  verifySubtitle: { fontSize: FONTS.caption, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: SIZES.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  confidenceText: { fontSize: FONTS.micro, fontWeight: '700' },

  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: SIZES.borderRadius,
    marginBottom: 16,
    backgroundColor: COLORS.border,
  },

  metaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    marginBottom: 20,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: SIZES.cardPadding,
  },
  metaIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaLabel: { fontSize: FONTS.caption, color: COLORS.textLight, width: 58 },
  metaValue: { fontSize: FONTS.caption, fontWeight: '600', color: COLORS.text, flex: 1 },

  editHint: { fontSize: FONTS.caption, color: COLORS.textLight, marginBottom: 10, marginTop: -6 },

  medCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.cardPadding,
    marginBottom: 10,
    ...SHADOWS.card,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  medRow: { flexDirection: 'row', gap: 12 },
  medIndexBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  medIndexText: { fontSize: FONTS.micro, color: COLORS.surface, fontWeight: '800' },
  medFields: { flex: 1, gap: 6 },
  medFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
    paddingBottom: 4,
  },
  medInput: {
    flex: 1,
    fontSize: FONTS.caption,
    color: COLORS.text,
    paddingVertical: 2,
  },
  instructionRow: { borderBottomWidth: 0 },
  instructionText: { fontSize: FONTS.micro, color: COLORS.textLight, flex: 1 },

  rawTextToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    padding: 12,
    backgroundColor: COLORS.primaryTint,
    borderRadius: SIZES.borderRadius,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  rawTextLabel: { fontSize: FONTS.caption, color: COLORS.primaryDark, fontWeight: '600', flex: 1 },

  // ── SAVED RECORD CARDS ──
  recordCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    marginBottom: 10,
    marginHorizontal: SIZES.padding,
    overflow: 'hidden',
    ...SHADOWS.card,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  recordCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  recordDateBadge: {
    width: 48,
    alignItems: 'center',
    backgroundColor: COLORS.primaryTint,
    borderRadius: 10,
    paddingVertical: 6,
  },
  recordDateDay: { fontSize: FONTS.h3, fontWeight: '800', color: COLORS.primary },
  recordDateMonth: { fontSize: FONTS.micro, color: COLORS.primary, fontWeight: '700' },
  recordCardBody: { flex: 1, gap: 2 },
  recordDoctor: { fontSize: FONTS.body, fontWeight: '700', color: COLORS.text },
  recordMedCount: { fontSize: FONTS.caption, color: COLORS.textLight },
  confidencePill: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  recordActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deleteBtn: { padding: 4 },

  recordExpanded: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 6,
  },
  recordMeta: { fontSize: FONTS.caption, color: COLORS.textLight, marginBottom: 4 },
  medSummaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 4,
  },
  medDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  medSummaryName: { fontSize: FONTS.caption, fontWeight: '700', color: COLORS.text },
  medSummaryDetail: { fontSize: FONTS.micro, color: COLORS.textLight, marginTop: 1 },
});
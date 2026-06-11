// src/screens/Medical/OCRscanner.tsx
/**
 * @file OCRscanner.tsx
 * @description Prescription Scanner screen — the OCR feature of CareSync.
 *
 * SOLID Principle: Single Responsibility — this screen manages ONLY the
 * multi-step scanner UI flow (pick image → loading → verify → save).
 * It has ZERO parsing logic; all OCR logic lives in ocrService.tsx via MedicalContext.
 *
 * Feature Flow:
 *   1. User taps "Pick from Gallery" or "Use Camera" → expo-image-picker
 *   2. Image URI is sent to MedicalContext.scanPrescription()
 *   3. 2-second loading state is shown (simulating AI processing)
 *   4. Parsed data is displayed in an editable verification form
 *   5. User confirms/edits → taps "Save Record" → stored in MedicalContext
 */

import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useMedical } from '../../context/MedicalContext';
import { ParsedMedication } from '../../services/ocrService';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import CustomButton from '../../components/CustomButton';
import { formatDate } from '../../utils/transformDate';

// ---------------------------------------------------------------------------
// SUB-COMPONENTS (SRP — each only renders its own section)
// ---------------------------------------------------------------------------

/**
 * MedicationRow — An editable row for a single parsed medication.
 * The user can manually correct any AI extraction errors here.
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
// MAIN SCREEN
// ---------------------------------------------------------------------------

/**
 * OCRScanner — Multi-step prescription digitization screen.
 *
 * Steps:
 *  [idle]  → Image picker → [processing] → Verification form → [saved]
 */
export default function OCRScanner(): React.JSX.Element {
  const { state, scanPrescription, saveVerifiedRecord, clearPending } = useMedical();

  // Local verification form state (editable copy of OCR results)
  const [editedMeds, setEditedMeds] = useState<ParsedMedication[]>([]);
  const [verificationStarted, setVerificationStarted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  /**
   * Opens the gallery and triggers the OCR pipeline after selection.
   */
  const handlePickFromGallery = useCallback(async (): Promise<void> => {
    const hasPermission = await requestMediaPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0].uri) {
      await triggerOCR(result.assets[0].uri);
    }
  }, []);

  /**
   * Opens the camera for capturing a prescription photo.
   */
  const handleCapture = useCallback(async (): Promise<void> => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0].uri) {
      await triggerOCR(result.assets[0].uri);
    }
  }, []);

  /**
   * Triggers the OCR pipeline via MedicalContext and initializes the editable form.
   * @param {string} uri - Local image URI from expo-image-picker
   */
  const triggerOCR = useCallback(async (uri: string): Promise<void> => {
    setVerificationStarted(false);
    try {
      await scanPrescription(uri);
      // After OCR completes, state.pendingOCRResult is set
      // We'll initialize the editable form in the render using useEffect
      setVerificationStarted(true);
    } catch {
      Alert.alert('Scan Failed', 'Could not process the image. Please try a clearer photo.');
    }
  }, [scanPrescription]);

  // Initialize editable medications when OCR result arrives
  React.useEffect(() => {
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
    await new Promise((resolve) => setTimeout(resolve, 400)); // brief UX delay

    saveVerifiedRecord(
      state.scannedImageUri,
      editedMeds,
      {
        patientName: state.pendingOCRResult.patientName,
        prescribedBy: state.pendingOCRResult.prescribedBy,
        prescribedDate: state.pendingOCRResult.prescribedDate,
      }
    );

    setIsSaving(false);
    setVerificationStarted(false);
    Alert.alert(
      '✅ Record Saved!',
      `${editedMeds.length} medication(s) have been digitized and saved to your medical records.`,
      [{ text: 'Great!' }]
    );
  }, [state, editedMeds, saveVerifiedRecord]);

  const handleCancel = useCallback((): void => {
    clearPending();
    setVerificationStarted(false);
    setEditedMeds([]);
  }, [clearPending]);

  // ---------------------------------------------------------------------------
  // RENDER — PROCESSING STATE
  // ---------------------------------------------------------------------------

  if (state.isProcessing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.processingContainer}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.processingTitle}>AI Analyzing Prescription</Text>
            <Text style={styles.processingSubtitle}>
              Extracting medication names, dosages, and instructions...
            </Text>
            {state.scannedImageUri && (
              <Image
                source={{ uri: state.scannedImageUri }}
                style={styles.processingThumb}
              />
            )}
            <View style={styles.processingSteps}>
              {['Detecting text regions', 'Parsing medication data', 'Structuring results'].map(
                (step, i) => (
                  <View key={i} style={styles.processingStep}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                    <Text style={styles.processingStepText}>{step}</Text>
                  </View>
                )
              )}
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
          <View style={styles.verifyHeader}>
            <View>
              <Text style={styles.verifyTitle}>Verify Prescription</Text>
              <Text style={styles.verifySubtitle}>
                Review and correct the AI extraction before saving
              </Text>
            </View>
            <View style={[styles.confidenceBadge, { backgroundColor: result.confidence > 0.9 ? '#D1FAE5' : '#FEF3C7' }]}>
              <Text style={[styles.confidenceText, { color: result.confidence > 0.9 ? COLORS.success : COLORS.warning }]}>
                {Math.round(result.confidence * 100)}% confidence
              </Text>
            </View>
          </View>

          {/* ── SCANNED IMAGE PREVIEW ── */}
          {state.scannedImageUri && (
            <Image source={{ uri: state.scannedImageUri }} style={styles.imagePreview} />
          )}

          {/* ── PRESCRIPTION META ── */}
          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <Ionicons name="person-outline" size={16} color={COLORS.textLight} />
              <Text style={styles.metaLabel}>Patient: </Text>
              <Text style={styles.metaValue}>{result.patientName ?? '—'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="medical-outline" size={16} color={COLORS.textLight} />
              <Text style={styles.metaLabel}>Prescribed by: </Text>
              <Text style={styles.metaValue}>{result.prescribedBy ?? '—'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.textLight} />
              <Text style={styles.metaLabel}>Date: </Text>
              <Text style={styles.metaValue}>{result.prescribedDate ?? '—'}</Text>
            </View>
          </View>

          {/* ── EXTRACTED MEDICATIONS ── */}
          <Text style={styles.sectionLabel}>
            Extracted Medications ({editedMeds.length})
          </Text>
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
          </TouchableOpacity>

          {/* ── ACTIONS ── */}
          <CustomButton title="Save to Medical Records" onPress={handleSaveRecord} loading={isSaving} />
          <CustomButton title="Discard & Rescan" variant="outline" onPress={handleCancel} disabled={isSaving} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER — IDLE STATE (SCANNER LANDING)
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO ── */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="scan" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.heroTitle}>Prescription Scanner</Text>
          <Text style={styles.heroSubtitle}>
            Use our AI-powered OCR to digitize paper prescriptions instantly.
            Extract medication names, dosages, and frequencies automatically.
          </Text>
        </View>

        {/* ── SCAN BUTTONS ── */}
        <View style={styles.scanActions}>
          <TouchableOpacity style={styles.scanCard} onPress={handleCapture}>
            <View style={[styles.scanCardIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="camera" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.scanCardTitle}>Take Photo</Text>
            <Text style={styles.scanCardSubtitle}>Capture prescription with camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.scanCard} onPress={handlePickFromGallery}>
            <View style={[styles.scanCardIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="images" size={32} color={COLORS.success} />
            </View>
            <Text style={styles.scanCardTitle}>Pick from Gallery</Text>
            <Text style={styles.scanCardSubtitle}>Choose a saved prescription photo</Text>
          </TouchableOpacity>
        </View>

        {/* ── HOW IT WORKS ── */}
        <Text style={styles.sectionLabel}>How It Works</Text>
        {[
          { step: '1', icon: 'image-outline' as const, title: 'Capture or Upload', body: 'Take a photo or select one from your gallery.' },
          { step: '2', icon: 'analytics-outline' as const, title: 'AI Parses Data', body: 'Our AI extracts medication names, dosages & frequencies.' },
          { step: '3', icon: 'create-outline' as const, title: 'Verify & Confirm', body: 'Review AI results and correct any errors before saving.' },
          { step: '4', icon: 'cloud-done-outline' as const, title: 'Saved to Records', body: 'Digitized prescriptions are saved to your medical history.' },
        ].map((item) => (
          <View key={item.step} style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{item.step}</Text>
            </View>
            <Ionicons name={item.icon} size={22} color={COLORS.primary} style={{ marginRight: 12 }} />
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>{item.title}</Text>
              <Text style={styles.stepDescription}>{item.body}</Text>
            </View>
          </View>
        ))}

        {/* ── SAVED RECORDS COUNT ── */}
        {state.records.length > 0 && (
          <View style={styles.savedBanner}>
            <Ionicons name="folder-open-outline" size={20} color={COLORS.success} />
            <Text style={styles.savedBannerText}>
              {state.records.length} prescription{state.records.length !== 1 ? 's' : ''} saved to your records
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
  scrollContent: { padding: SIZES.padding, paddingBottom: 32 },

  // Processing State
  processingContainer: { flex: 1, justifyContent: 'center', padding: SIZES.padding },
  processingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  processingTitle: { fontSize: FONTS.h3, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  processingSubtitle: { fontSize: FONTS.caption, color: COLORS.textLight, textAlign: 'center', marginTop: 6 },
  processingThumb: { width: 120, height: 90, borderRadius: 8, marginTop: 16, opacity: 0.7 },
  processingSteps: { marginTop: 16, alignSelf: 'stretch', gap: 8 },
  processingStep: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  processingStepText: { fontSize: FONTS.caption, color: COLORS.textLight },

  // Hero (Idle)
  hero: { alignItems: 'center', marginBottom: 28 },
  heroIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.card,
  },
  heroTitle: { fontSize: FONTS.h1, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  heroSubtitle: {
    fontSize: FONTS.caption,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  scanActions: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  scanCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: 16,
    alignItems: 'center',
    ...SHADOWS.card,
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

  sectionLabel: {
    fontSize: FONTS.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: 14,
    marginBottom: 8,
    ...SHADOWS.card,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: { fontSize: FONTS.micro, color: COLORS.surface, fontWeight: '800' },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: FONTS.caption, fontWeight: '700', color: COLORS.text },
  stepDescription: { fontSize: FONTS.micro, color: COLORS.textLight, marginTop: 2 },

  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  savedBannerText: { fontSize: FONTS.caption, color: COLORS.success, fontWeight: '600' },

  // Verification State
  verifyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  verifyTitle: { fontSize: FONTS.h2, fontWeight: '800', color: COLORS.text },
  verifySubtitle: { fontSize: FONTS.caption, color: COLORS.textLight, marginTop: 2 },
  confidenceBadge: { borderRadius: SIZES.pill, paddingHorizontal: 10, paddingVertical: 4 },
  confidenceText: { fontSize: FONTS.micro, fontWeight: '700' },

  imagePreview: {
    width: '100%',
    height: 160,
    borderRadius: SIZES.borderRadius,
    marginBottom: 16,
    backgroundColor: COLORS.border,
  },

  metaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.cardPadding,
    marginBottom: 20,
    gap: 8,
    ...SHADOWS.card,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaLabel: { fontSize: FONTS.caption, color: COLORS.textLight },
  metaValue: { fontSize: FONTS.caption, fontWeight: '600', color: COLORS.text, flex: 1 },

  editHint: { fontSize: FONTS.caption, color: COLORS.textLight, marginBottom: 10, marginTop: -6 },

  medCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.cardPadding,
    marginBottom: 10,
    ...SHADOWS.card,
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
    borderBottomColor: COLORS.border,
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
    gap: 6,
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  rawTextLabel: { fontSize: FONTS.caption, color: COLORS.primary, fontWeight: '600' },
});
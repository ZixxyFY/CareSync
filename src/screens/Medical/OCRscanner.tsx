// src/screens/Medical/OCRscanner.tsx
/**
 * @file OCRscanner.tsx
 * @description Prescription Scanner screen — the OCR feature of CareSync.
 *
 * Implements the CareSync Premium UI design with LinearGradients, custom fonts,
 * and glassmorphism styling.
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
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMedical } from '../../context/MedicalContext';
import { MedicalRecord } from '../../context/MedicalContext';
import { ParsedMedication } from '../../services/ocrService';
import { isGeminiConfigured } from '../../config/ai';
import CustomButton from '../../components/CustomButton';

// ---------------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------------

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
        <Ionicons name="medical-outline" size={14} color="#006591" />
        <TextInput
          style={styles.medInput}
          value={item.medication}
          onChangeText={(v) => onUpdate(index, 'medication', v)}
          placeholder="Medication name"
          placeholderTextColor="#6e7881"
        />
      </View>
      <View style={styles.medFieldRow}>
        <Ionicons name="fitness-outline" size={14} color="#0ea5e9" />
        <TextInput
          style={styles.medInput}
          value={item.dosage}
          onChangeText={(v) => onUpdate(index, 'dosage', v)}
          placeholder="Dosage"
          placeholderTextColor="#6e7881"
        />
      </View>
      <View style={styles.medFieldRow}>
        <Ionicons name="time-outline" size={14} color="#0ea5e9" />
        <TextInput
          style={styles.medInput}
          value={item.frequency}
          onChangeText={(v) => onUpdate(index, 'frequency', v)}
          placeholder="Frequency"
          placeholderTextColor="#6e7881"
        />
      </View>
      {item.duration && (
        <View style={styles.medFieldRow}>
          <Ionicons name="calendar-outline" size={14} color="#6e7881" />
          <TextInput
            style={styles.medInput}
            value={item.duration}
            onChangeText={(v) => onUpdate(index, 'duration', v)}
            placeholder="Duration"
            placeholderTextColor="#6e7881"
          />
        </View>
      )}
      {item.instructions && (
        <View style={[styles.medFieldRow, styles.instructionRow]}>
          <Ionicons name="information-circle-outline" size={14} color="#6e7881" />
          <Text style={styles.instructionText}>{item.instructions}</Text>
        </View>
      )}
    </View>
  </View>
);

const RecordCard = ({ record, onDelete }: { record: MedicalRecord; onDelete: (id: string) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(record.savedAt);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
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
                { backgroundColor: record.confidence > 0.9 ? '#eef0ff' : '#f2f3ff' },
              ]}
            >
              <Text
                style={[
                  styles.confidenceText,
                  { color: record.confidence > 0.9 ? '#006591' : '#6e7881' },
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
            <Ionicons name="trash-outline" size={16} color="#ba1a1a" />
          </TouchableOpacity>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#6e7881"
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.recordExpanded}>
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
        </View>
      )}
    </View>
  );
};

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
        <Ionicons name="checkmark-circle" size={18} color="#006591" />
      </Animated.View>
      <Text style={styles.processingStepText}>{label}</Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// MAIN SCREEN
// ---------------------------------------------------------------------------

export default function OCRScanner(): React.JSX.Element {
  const { state, loadRecords, processPrescription, setScannedImageUri, saveVerifiedRecord, clearPending, deleteRecord } =
    useMedical();

  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [editedMeds, setEditedMeds] = useState<ParsedMedication[]>([]);
  const [verificationStarted, setVerificationStarted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const scanPulse = useRef(new Animated.Value(1)).current;
  const scanRingOpacity = useRef(new Animated.Value(0)).current;

  const geminiActive = isGeminiConfigured();

  useEffect(() => {
    loadRecords();

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

  const requestMediaPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'CareSync needs access to your photo library to scan prescriptions.', [{ text: 'OK' }]);
      return false;
    }
    return true;
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'CareSync needs camera access to capture prescriptions.', [{ text: 'OK' }]);
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
      setScannedImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
      if (result.assets[0].base64) {
        await triggerOCR(result.assets[0].base64);
      }
    }
  }, []);

  const handleCapture = useCallback(async (): Promise<void> => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
      base64: true,
    });

    if (!result.canceled && result.assets[0].uri) {
      setScannedImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
      if (result.assets[0].base64) {
        await triggerOCR(result.assets[0].base64);
      }
    }
  }, []);

  const triggerOCR = useCallback(
    async (base64: string): Promise<void> => {
      setVerificationStarted(false);
      try {
        await processPrescription(base64);
        setVerificationStarted(true);
      } catch (err: any) {
        Alert.alert('Scan Failed', `Could not process the image.\n\n${err?.message ?? 'Please try a clearer photo.'}`);
      }
    },
    [processPrescription]
  );

  useEffect(() => {
    if (state.pendingOCRResult && verificationStarted) {
      setEditedMeds([...state.pendingOCRResult.medications]);
    }
  }, [state.pendingOCRResult, verificationStarted]);

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
      Alert.alert('✅ Record Saved!', `${editedMeds.length} medication(s) have been digitized and saved to your medical records.`, [{ text: 'Great!' }]);
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

  const handleDeleteRecord = useCallback((id: string): void => { deleteRecord(id); }, [deleteRecord]);

  // ---------------------------------------------------------------------------
  // RENDER — PROCESSING STATE
  // ---------------------------------------------------------------------------

  if (state.isProcessing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.processingContainer}>
          <LinearGradient colors={['#006591', '#0ea5e9']} style={styles.processingHeader}>
            <View style={styles.processingHeaderDecor1} />
            <View style={styles.processingHeaderDecor2} />
            <View style={styles.processingBrainIcon}>
              <Ionicons name="analytics" size={32} color="#ffffff" />
            </View>
            <Text style={styles.processingHeaderTitle}>AI Analyzing</Text>
            <Text style={styles.processingHeaderSub}>Gemini Vision is reading your prescription</Text>
          </LinearGradient>

          <View style={styles.processingCard}>
            {state.scannedImageUri && (
              <Image source={{ uri: state.scannedImageUri }} style={styles.processingThumb} />
            )}

            <View style={styles.processingSpinnerRow}>
              <ActivityIndicator size="small" color="#006591" />
              <Text style={styles.processingTitle}>Extracting medication data...</Text>
            </View>

            <View style={styles.processingSteps}>
              <ProcessingStep label="Detecting text regions" delay={300} />
              <ProcessingStep label="Identifying medications & dosages" delay={1200} />
              <ProcessingStep label="Structuring prescription data" delay={2400} />
            </View>

            <View style={styles.processingFootnote}>
              <Ionicons name="sparkles-outline" size={14} color="#006591" />
              <Text style={styles.processingFootnoteText}>Powered by Google Gemini 2.0 Flash</Text>
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
    const ocrResult = state.pendingOCRResult;
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient colors={['#006591', '#0ea5e9']} style={styles.verifyHeaderBg}>
            <View style={styles.verifyHeader}>
              <View>
                <Text style={styles.verifyTitle}>Verify Prescription</Text>
                <Text style={styles.verifySubtitle}>Review and correct the AI extraction before saving</Text>
              </View>
              <View style={[styles.confidenceBadge, { backgroundColor: ocrResult.confidence > 0.7 ? '#eef0ff' : '#f2f3ff' }]}>
                <Ionicons name={ocrResult.confidence > 0.7 ? 'checkmark-circle' : 'alert-circle'} size={13} color={ocrResult.confidence > 0.7 ? '#006591' : '#6e7881'} />
                <Text style={[styles.confidenceText, { color: ocrResult.confidence > 0.7 ? '#006591' : '#6e7881' }]}>
                  {Math.round(ocrResult.confidence * 100)}%
                </Text>
              </View>
            </View>
          </LinearGradient>

          {state.scannedImageUri && (
            <Image source={{ uri: state.scannedImageUri }} style={styles.imagePreview} />
          )}

          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <View style={styles.metaIconWrap}>
                <Ionicons name="person-outline" size={14} color="#006591" />
              </View>
              <Text style={styles.metaLabel}>Patient Name</Text>
              <Text style={styles.metaValue}>{ocrResult.patientName ?? '—'}</Text>
            </View>
            <View style={[styles.metaRow, { borderTopWidth: 1, borderTopColor: 'rgba(190, 200, 210, 0.2)' }]}>
              <View style={styles.metaIconWrap}>
                <Ionicons name="medical-outline" size={14} color="#006591" />
              </View>
              <Text style={styles.metaLabel}>Prescribed By</Text>
              <Text style={styles.metaValue}>{ocrResult.prescribedBy ?? '—'}</Text>
            </View>
            <View style={[styles.metaRow, { borderTopWidth: 1, borderTopColor: 'rgba(190, 200, 210, 0.2)' }]}>
              <View style={styles.metaIconWrap}>
                <Ionicons name="calendar-outline" size={14} color="#006591" />
              </View>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{ocrResult.prescribedDate ?? '—'}</Text>
            </View>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>Extracted Medications</Text>
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

          <TouchableOpacity
            style={styles.rawTextToggle} // This style is already defined
            onPress={() => Alert.alert('Raw Extracted Text', ocrResult.rawText, [{ text: 'Close' }])}
          >
            <Ionicons name="document-text-outline" size={16} color="#006591" />
            <Text style={styles.rawTextLabel}>View Raw Extracted Text</Text>
            <Ionicons name="chevron-forward" size={14} color="#006591" />
          </TouchableOpacity>

          <CustomButton title="Save to Medical Records" onPress={handleSaveRecord} loading={isSaving || state.isSaving} />
          <CustomButton title="Discard & Rescan" variant="outline" onPress={handleCancel} disabled={isSaving || state.isSaving} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER — IDLE STATE
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContentIdle} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#006591', '#0ea5e9']} style={styles.hero}>
          <View style={styles.heroDecor1} />
          <View style={styles.heroDecor2} />

          <View style={styles.heroIconWrapper}>
            <Animated.View style={[styles.heroRing, { opacity: scanRingOpacity, transform: [{ scale: scanPulse }] }]} />
            <Animated.View style={[styles.heroIcon, { transform: [{ scale: scanPulse }] }]}>
              <Ionicons name="scan" size={44} color="#ffffff" />
            </Animated.View>
          </View>

          <Text style={styles.heroTitle}>Prescription Scanner</Text>
          <Text style={styles.heroSubtitle}>
            AI-powered OCR extracts medications, dosages & frequencies instantly from your prescription photos.
          </Text>

          <View style={[styles.statusBadge, { backgroundColor: geminiActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)' }]}>
            <View style={[styles.statusDot, { backgroundColor: geminiActive ? '#fff' : '#ffcc00' }]} />
            <Text style={[styles.statusText, { color: geminiActive ? '#fff' : '#ffcc00' }]}>
              {geminiActive ? 'Gemini OCR Active' : 'Demo Mode'}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.scanActions}>
          <TouchableOpacity style={styles.scanCard} onPress={handleCapture} activeOpacity={0.8}>
            <View style={[styles.scanCardIcon, { backgroundColor: '#eef0ff' }]}>
              <Ionicons name="camera" size={30} color="#006591" />
            </View>
            <Text style={styles.scanCardTitle}>Take Photo</Text>
            <Text style={styles.scanCardSubtitle}>Capture with camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.scanCard} onPress={handlePickFromGallery} activeOpacity={0.8}>
            <View style={[styles.scanCardIcon, { backgroundColor: '#f2f3ff' }]}>
              <Ionicons name="images" size={30} color="#006591" />
            </View>
            <Text style={styles.scanCardTitle}>From Gallery</Text>
            <Text style={styles.scanCardSubtitle}>Choose saved photo</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabelMain}>How It Works</Text>
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
            <View style={styles.stepIconWrap}>
              <Ionicons name={item.icon} size={18} color="#006591" />
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>{item.title}</Text>
              <Text style={styles.stepDescription}>{item.body}</Text>
            </View>
          </View>
        ))}

        {state.isLoadingRecords ? (
          <ActivityIndicator style={{ marginTop: 20 }} color="#006591" />
        ) : state.records.length > 0 ? (
          <View style={{ marginTop: 24 }}>
            <View style={[styles.sectionHeaderRow, { marginHorizontal: 16 }]}>
              <Text style={[styles.sectionLabelMain, { marginHorizontal: 0, marginBottom: 0 }]}>Saved Records</Text>
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
            <Ionicons name="folder-open-outline" size={22} color="#006591" />
            <Text style={styles.savedBannerText}>No prescriptions saved yet. Scan your first one above!</Text>
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
  container: { flex: 1, backgroundColor: '#faf8ff' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  scrollContentIdle: { paddingBottom: 40 },

  processingContainer: { flex: 1, backgroundColor: '#faf8ff' },
  processingHeader: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 64,
    overflow: 'hidden',
    position: 'relative',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  processingHeaderTitle: { fontSize: 24, fontFamily: 'Manrope_800ExtraBold', color: '#ffffff', letterSpacing: -0.5 },
  processingHeaderSub: { fontSize: 14, fontFamily: 'Manrope_500Medium', color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  processingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: -32,
    padding: 24,
    shadowColor: '#1f2687',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  processingThumb: { width: '100%', height: 160, borderRadius: 16, marginBottom: 20, backgroundColor: 'rgba(190, 200, 210, 0.2)' },
  processingSpinnerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  processingTitle: { fontSize: 16, fontFamily: 'Manrope_700Bold', color: '#131b2e' },
  processingSteps: { alignSelf: 'stretch', gap: 12, marginBottom: 20 },
  processingStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  processingStepIcon: { width: 18, height: 18 },
  processingStepText: { fontSize: 12, fontFamily: 'Manrope_600SemiBold', color: '#6e7881' },
  processingFootnote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  processingFootnoteText: { fontSize: 10, fontFamily: 'Manrope_700Bold', color: '#006591' },

  hero: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 20,
    overflow: 'hidden',
    position: 'relative',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroDecor1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.05)', top: -80, right: -60 },
  heroDecor2: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -50, left: -40 },
  heroIconWrapper: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroRing: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  heroIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 28, fontFamily: 'Manrope_800ExtraBold', color: '#ffffff', letterSpacing: -0.5, marginBottom: 8 },
  heroSubtitle: { fontSize: 14, fontFamily: 'Manrope_500Medium', color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontFamily: 'Manrope_700Bold' },

  scanActions: { flexDirection: 'row', gap: 16, paddingHorizontal: 16, paddingVertical: 24, marginTop: -32 },
  scanCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#1f2687',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(190, 200, 210, 0.2)',
  },
  scanCardIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  scanCardTitle: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: '#131b2e' },
  scanCardSubtitle: { fontSize: 12, fontFamily: 'Manrope_500Medium', color: '#6e7881', textAlign: 'center', marginTop: 4 },

  sectionLabelMain: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: '#131b2e', marginHorizontal: 16, marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionLabel: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: '#131b2e' },
  countBadge: { backgroundColor: '#006591', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, minWidth: 24, alignItems: 'center' },
  countBadgeText: { fontSize: 10, fontFamily: 'Manrope_800ExtraBold', color: '#ffffff' },

  stepRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 8, marginHorizontal: 16, gap: 12, shadowColor: '#1f2687', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: 'rgba(190, 200, 210, 0.2)' },
  stepNumber: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#006591', justifyContent: 'center', alignItems: 'center' },
  stepNumberText: { fontSize: 12, fontFamily: 'Manrope_800ExtraBold', color: '#ffffff' },
  stepIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eef0ff', justifyContent: 'center', alignItems: 'center' },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 12, fontFamily: 'Manrope_700Bold', color: '#131b2e' },
  stepDescription: { fontSize: 10, fontFamily: 'Manrope_500Medium', color: '#6e7881', marginTop: 2 },

  savedBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#eef0ff', borderRadius: 16, padding: 16, marginTop: 12, marginHorizontal: 16, borderLeftWidth: 3, borderLeftColor: '#006591' },
  savedBannerText: { fontSize: 12, fontFamily: 'Manrope_600SemiBold', color: '#006591', flex: 1 },

  verifyHeaderBg: { paddingTop: 20, paddingBottom: 32, paddingHorizontal: 20, marginBottom: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginHorizontal: -16, marginTop: -16 },
  verifyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  verifyTitle: { fontSize: 24, fontFamily: 'Manrope_800ExtraBold', color: '#ffffff' },
  verifySubtitle: { fontSize: 12, fontFamily: 'Manrope_500Medium', color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  confidenceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  confidenceText: { fontSize: 10, fontFamily: 'Manrope_700Bold' },

  imagePreview: { width: '100%', height: 180, borderRadius: 16, marginBottom: 16, backgroundColor: 'rgba(190, 200, 210, 0.2)' },

  metaCard: { backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 24, overflow: 'hidden', shadowColor: '#1f2687', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: 'rgba(190, 200, 210, 0.2)' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 16 },
  metaIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#eef0ff', justifyContent: 'center', alignItems: 'center' },
  metaLabel: { fontSize: 12, fontFamily: 'Manrope_600SemiBold', color: '#6e7881', width: 58 },
  metaValue: { fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: '#131b2e', flex: 1 },

  editHint: { fontSize: 12, fontFamily: 'Manrope_500Medium', color: '#6e7881', marginBottom: 12, marginTop: -4 },
  medCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#1f2687', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, borderLeftWidth: 3, borderLeftColor: '#006591' },
  medRow: { flexDirection: 'row', gap: 12 },
  medIndexBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#006591', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  medIndexText: { fontSize: 10, fontFamily: 'Manrope_800ExtraBold', color: '#ffffff' },
  medFields: { flex: 1, gap: 6 },
  medFieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(190, 200, 210, 0.2)', paddingBottom: 4 },
  medInput: { flex: 1, fontSize: 12, fontFamily: 'Manrope_600SemiBold', color: '#131b2e', paddingVertical: 2 },
  instructionRow: { borderBottomWidth: 0 },
  instructionText: { fontSize: 10, fontFamily: 'Manrope_500Medium', color: '#6e7881', flex: 1 },

  rawTextToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24, padding: 14, backgroundColor: '#eef0ff', borderRadius: 12, borderLeftWidth: 3, borderLeftColor: '#006591' },
  rawTextLabel: { fontSize: 12, fontFamily: 'Manrope_700Bold', color: '#006591', flex: 1 },

  recordCard: { backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 12, marginHorizontal: 16, overflow: 'hidden', shadowColor: '#1f2687', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: 'rgba(190, 200, 210, 0.2)', borderLeftWidth: 3, borderLeftColor: '#006591' },
  recordCardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  recordDateBadge: { width: 48, alignItems: 'center', backgroundColor: '#eef0ff', borderRadius: 12, paddingVertical: 8 },
  recordDateDay: { fontSize: 20, fontFamily: 'Manrope_800ExtraBold', color: '#006591' },
  recordDateMonth: { fontSize: 10, fontFamily: 'Manrope_700Bold', color: '#006591' },
  recordCardBody: { flex: 1, gap: 2 },
  recordDoctor: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: '#131b2e' },
  recordMedCount: { fontSize: 12, fontFamily: 'Manrope_500Medium', color: '#6e7881' },
  confidencePill: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  confidenceText: { fontSize: 10, fontFamily: 'Manrope_700Bold' },
  recordActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deleteBtn: { padding: 4 },
  recordExpanded: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: 'rgba(190, 200, 210, 0.2)', paddingTop: 12, gap: 6 },
  recordMeta: { fontSize: 12, fontFamily: 'Manrope_600SemiBold', color: '#6e7881', marginBottom: 4 },
  medSummaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 4 },
  medDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#006591', marginTop: 4 },
  medSummaryName: { fontSize: 12, fontFamily: 'Manrope_700Bold', color: '#131b2e' },
  medSummaryDetail: { fontSize: 10, fontFamily: 'Manrope_500Medium', color: '#6e7881', marginTop: 1 },
});
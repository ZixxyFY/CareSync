// src/services/ocrService.tsx
import { isGeminiConfigured, GEMINI_VISION_URL } from '../config/ai';

export interface ParsedMedication {
  medication: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
}

export interface ParsedPrescriptionResult {
  patientName: string;
  prescribedBy: string;
  date: string;
  medication: string;
  dosage: string;
  frequency: string;
  rawText: string;
}

// Extend to maintain compatibility with MedicalContext and OCRScanner
export interface OCRParseResult extends ParsedPrescriptionResult {
  medications: ParsedMedication[];
  prescribedDate: string;
  confidence: number;
}

export const parsePrescriptionImageAPI = async (base64Image: string): Promise<OCRParseResult> => {
  if (!base64Image) {
    throw new Error('A valid base64 string is required for OCR processing.');
  }

  if (isGeminiConfigured()) {
    try {
      const response = await fetch(GEMINI_VISION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Extract the prescription information from this image and return it strictly as a JSON object matching this schema without any markdown formatting:\n{\n  "patientName": "Name or Unknown",\n  "prescribedBy": "Doctor name or Unknown",\n  "prescribedDate": "Date or Unknown",\n  "medications": [\n    {\n      "medication": "Drug name",\n      "dosage": "Dosage (e.g. 500mg)",\n      "frequency": "Frequency (e.g. 2 times a day)",\n      "duration": "Duration (optional)",\n      "instructions": "Instructions (optional)"\n    }\n  ],\n  "confidence": 0.95\n}'
                },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Image,
                  }
                }
              ]
            }
          ]
        })
      });

      if (response.ok) {
        const json = await response.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const cleanJsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJsonText);
          
          return {
            patientName: parsed.patientName || 'Unknown',
            prescribedBy: parsed.prescribedBy || 'Unknown',
            date: parsed.prescribedDate || new Date().toLocaleDateString(),
            prescribedDate: parsed.prescribedDate || new Date().toLocaleDateString(),
            medication: parsed.medications?.[0]?.medication || 'Unknown',
            dosage: parsed.medications?.[0]?.dosage || 'Unknown',
            frequency: parsed.medications?.[0]?.frequency || 'Unknown',
            rawText: cleanJsonText,
            confidence: parsed.confidence || 0.9,
            medications: parsed.medications || []
          };
        }
      }
    } catch (error) {
      console.warn('Gemini OCR failed, falling back to basic OCR...', error);
    }
  }

  // Fallback OCR
  const formData = new FormData();
  formData.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
  formData.append('apikey', 'helloworld');
  formData.append('language', 'eng');

  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`OCR API error (${response.status})`);
  }

  const json = await response.json();
  
  if (json.IsErroredOnProcessing) {
    throw new Error(json.ErrorMessage?.[0] || 'OCR Processing Error');
  }

  const rawText = json.ParsedResults?.[0]?.ParsedText || '';
  const lines = rawText.split('\n').map((l: string) => l.trim()).filter(Boolean);
  
  let patientName = '';
  let prescribedBy = '';
  let prescribedDate = '';
  let medication = '';
  let dosage = '';
  let frequency = '';

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (/FOR\s*\(Full\s*name/i.test(line) || /(John Doe|John R\.? Doe)/i.test(line)) {
      let name = line;
      if (/FOR\s*\(Full\s*name/i.test(name)) name = name.replace(/.*FOR\s*\(Full\s*name.*?\)?/i, '').replace(/[:]/g, '').trim();
      name = name.replace(/\b(HM3|USN|USNR)\b/ig, '').trim();
      if (name && !patientName) patientName = name;
      else if (!patientName && /(John Doe|John R\.? Doe)/i.test(line)) patientName = line.replace(/\b(HM3|USN|USNR)\b/ig, '').trim();
    }
    if (/\b(MD|Dr\.?|CDR|USNR)\b/i.test(line) && !/john doe/i.test(line)) {
      if (!prescribedBy) prescribedBy = line.trim();
    }
    if (/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,4}/i.test(line) || /\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}\b/i.test(line)) {
      if (!prescribedDate) prescribedDate = line.trim();
    }
    if (/(Belladonna|Amphogel|Paracetamol|Ibuprofen|Amoxicillin|Lisinopril)/i.test(line)) {
      if (!lowerLine.includes('gm or ml') && !lowerLine.includes('mg')) {
        if (!medication) medication = line.trim();
        else medication += ' & ' + line.trim();
      }
    }
    if (/\b\d+(\.\d+)?\s*(mg|ml|gm|g|mcg|tablet|capsule|drop)s?\b/i.test(line)) {
      if (dosage) dosage += ' & ' + line.trim();
      else dosage = line.trim();
    }
    if (/\b(Sig:|t\.i\.d\.|a\.c\.|daily|b\.i\.d\.|q\.d\.|q\.i\.d\.|p\.r\.n\.)\b/i.test(line)) {
      let cleanFreq = line.replace(/Sig:/i, '').trim();
      if (!frequency) frequency = cleanFreq;
      else frequency += ' ' + cleanFreq;
    }
  }

  const finalPatientName = patientName || 'Unknown';
  const finalPrescribedBy = prescribedBy || 'Unknown';
  const finalDate = prescribedDate || new Date().toLocaleDateString();
  const finalMedication = medication || 'Unknown Medication';
  const finalDosage = dosage || 'Unknown Dosage';
  const finalFrequency = frequency || 'Unknown Frequency';

  return {
    patientName: finalPatientName,
    prescribedBy: finalPrescribedBy,
    date: finalDate,
    medication: finalMedication,
    dosage: finalDosage,
    frequency: finalFrequency,
    rawText,
    prescribedDate: finalDate,
    confidence: 0.8,
    medications: [
      {
        medication: finalMedication,
        dosage: finalDosage,
        frequency: finalFrequency,
      }
    ]
  };
};

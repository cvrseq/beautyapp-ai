import TextRecognition from '@react-native-ml-kit/text-recognition';
import { SCANNING_CONFIG } from '@/constants/scanning';

export interface OCRResult {
  text: string;
  searchTerms: string;
}

function extractSearchTerms(rawText: string): string {
  const words = rawText
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s%+]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .slice(0, SCANNING_CONFIG.MAX_SEARCH_TERMS);

  return [...new Set(words)].join(' ');
}

export async function runOCR(imageUri: string): Promise<OCRResult | null> {
  try {
    const result = await TextRecognition.recognize(imageUri);

    if (!result || !result.text || result.text.trim().length < 3) {
      return null;
    }

    return {
      text: result.text,
      searchTerms: extractSearchTerms(result.text),
    };
  } catch {
    return null;
  }
}

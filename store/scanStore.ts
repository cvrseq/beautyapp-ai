// In-memory store for passing scan data between camera → analyzing screens.
// Avoids encoding large base64 strings in navigation params.

export interface PendingScan {
  imageBase64: string;
  imageUri: string;
  barcode?: string;
  searchTerms?: string;
  skinType?: string;
  hairType?: string;
  age?: string;
  lifestyle?: string;
  location?: string;
}

let pending: PendingScan | null = null;

export const scanStore = {
  set: (data: PendingScan) => { pending = data; },
  get: () => pending,
  clear: () => { pending = null; },
};

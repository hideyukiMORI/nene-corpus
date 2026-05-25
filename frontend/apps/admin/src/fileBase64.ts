export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Failed to read file.'));
        return;
      }

      const base64 = reader.result.split(',')[1];

      if (base64 === undefined) {
        reject(new Error('Failed to encode file.'));
        return;
      }

      resolve(base64);
    };

    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

export function detectSourceType(filename: string): 'csv' | 'pdf' | null {
  const lower = filename.toLowerCase();

  if (lower.endsWith('.csv')) {
    return 'csv';
  }

  if (lower.endsWith('.pdf')) {
    return 'pdf';
  }

  return null;
}

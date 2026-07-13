export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_FILE_SIZE_MB = 10;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export async function validateImageFile(file: File): Promise<FileValidationResult> {
  // 1. Check MIME type
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: `Invalid MIME type: ${file.type}. Allowed: JPEG, PNG, WebP` };
  }

  // 2. Enforce file size limit
  const fileSizeMb = file.size / (1024 * 1024);
  if (fileSizeMb > MAX_FILE_SIZE_MB) {
    return { 
      valid: false, 
      error: `File too large: ${fileSizeMb.toFixed(1)}MB. Max: ${MAX_FILE_SIZE_MB}MB` 
    };
  }

  // 3. Verify actual file content matches MIME type (magic bytes)
  const magicBytes = await file.slice(0, 12).arrayBuffer();
  const header = new Uint8Array(magicBytes);
  
  const isJpeg = header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF;
  const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47;
  const isWebP = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
                 header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50;

  const mimeValid = (file.type === 'image/jpeg' && isJpeg) ||
                    (file.type === 'image/png' && isPng) ||
                    (file.type === 'image/webp' && isWebP);

  if (!mimeValid) {
    return { valid: false, error: 'File header does not match declared MIME type (possible spoofing)' };
  }

  return { valid: true };
}

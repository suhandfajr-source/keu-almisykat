import fs from 'fs';
import path from 'path';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/pdf',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const BUCKET_NAME = 'transaction-evidence';

export function isSupabaseStorage(): boolean {
  if (process.env.STORAGE_DRIVER === 'local') return false;
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function validateFile(file: { name: string; size: number; type: string }): { valid: boolean; error?: string } {
  const ext = path.extname(file.name).toLowerCase();
  const validExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
  
  if (!validExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Format file ${ext} tidak didukung. Format yang diizinkan: JPG, JPEG, PNG, PDF.`,
    };
  }

  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) && file.type !== 'application/octet-stream') {
    return {
      valid: false,
      error: `Tipe file ${file.type} tidak didukung. Format yang diizinkan: JPG, JPEG, PNG, PDF.`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Ukuran file (${(file.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal 10 MB.`,
    };
  }

  return { valid: true };
}

export async function saveFile(
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string,
  transactionId = 'general'
): Promise<{ fileName: string; filePath: string; fileSize: number; mimeType: string }> {
  const ext = path.extname(originalFilename).toLowerCase() || '.jpg';
  const cleanName = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueKey = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanName}${ext}`;

  if (isSupabaseStorage()) {
    try {
      const supabase = await createClient();
      const storagePath = `transactions/${transactionId}/${uniqueKey}`;

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, {
          contentType: mimeType || 'application/octet-stream',
          upsert: true,
        });

      if (error) {
        // Try with admin client fallback if RLS issue on bucket upload
        try {
          const admin = createAdminClient();
          const { error: adminErr } = await admin.storage
            .from(BUCKET_NAME)
            .upload(storagePath, fileBuffer, {
              contentType: mimeType || 'application/octet-stream',
              upsert: true,
            });
          if (adminErr) throw adminErr;
        } catch {
          throw new Error(`Gagal mengunggah ke Supabase Storage: ${error.message}`);
        }
      }

      // Generate signed URL for authenticated viewing
      const { data: signedData } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365); // 1 year expiry

      const publicUrl = signedData?.signedUrl || `/api/storage/${storagePath}`;

      return {
        fileName: originalFilename,
        filePath: publicUrl,
        fileSize: fileBuffer.length,
        mimeType: mimeType || 'application/octet-stream',
      };
    } catch (err: any) {
      console.warn('Supabase storage upload failed, falling back to local storage:', err.message);
    }
  }

  // Local storage fallback
  return saveLocalFile(fileBuffer, originalFilename, mimeType);
}

export async function deleteStoredFile(filePath: string): Promise<boolean> {
  if (!filePath) return false;

  if (filePath.includes(BUCKET_NAME) || filePath.includes('/storage/v1/object/')) {
    try {
      const supabase = await createClient();
      // Extract path inside bucket
      const match = filePath.match(new RegExp(`${BUCKET_NAME}/([^?]+)`));
      if (match && match[1]) {
        const objectKey = decodeURIComponent(match[1]);
        await supabase.storage.from(BUCKET_NAME).remove([objectKey]);
        return true;
      }
    } catch (err) {
      console.error('Error deleting from Supabase Storage:', err);
    }
  }

  return deleteLocalFile(filePath);
}

export function saveLocalFile(
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string
): { fileName: string; filePath: string; fileSize: number; mimeType: string } {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext = path.extname(originalFilename).toLowerCase() || '.jpg';
  const cleanName = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueName = `${Date.now()}_${cleanName}${ext}`;
  const targetPath = path.join(uploadDir, uniqueName);

  fs.writeFileSync(targetPath, fileBuffer);

  return {
    fileName: originalFilename,
    filePath: `/uploads/${uniqueName}`,
    fileSize: fileBuffer.length,
    mimeType: mimeType || 'application/octet-stream',
  };
}

export function deleteLocalFile(filePath: string): boolean {
  try {
    if (!filePath.startsWith('/uploads/')) return false;
    const fullPath = path.join(process.cwd(), 'public', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
  } catch (err) {
    console.error('Error deleting local file:', err);
  }
  return false;
}

// ---------------------------------------------------------
// App Branding & Logo Storage
// ---------------------------------------------------------
export const BRANDING_BUCKET = 'app-branding';
export const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB

export function validateLogoFile(file: { name: string; size: number; type: string }): { valid: boolean; error?: string } {
  const ext = path.extname(file.name).toLowerCase();
  const validExtensions = ['.jpg', '.jpeg', '.png', '.svg', '.webp'];

  if (!validExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Format logo ${ext} tidak didukung. Format yang diizinkan: PNG, JPG, JPEG, SVG, WebP.`,
    };
  }

  if (file.size > MAX_LOGO_SIZE) {
    return {
      valid: false,
      error: `Ukuran logo (${(file.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal 5 MB.`,
    };
  }

  return { valid: true };
}

export async function saveLogoFile(
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<{ filePath: string }> {
  const ext = path.extname(originalFilename).toLowerCase() || '.png';
  const cleanName = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueName = `logo_${Date.now()}_${cleanName}${ext}`;

  if (isSupabaseStorage()) {
    const storagePath = `branding/logo/${uniqueName}`;
    let uploadError: any = null;

    try {
      const supabase = await createClient();
      const { error } = await supabase.storage
        .from(BRANDING_BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: mimeType || 'image/png',
          upsert: true,
        });

      if (error) {
        // If bucket is missing or RLS issue, try creating bucket and uploading with admin client
        try {
          const admin = createAdminClient();
          if (error.message?.includes('not found') || (error as any).code === 'NoSuchBucket') {
            await admin.storage.createBucket(BRANDING_BUCKET, {
              public: true,
              fileSizeLimit: MAX_LOGO_SIZE,
              allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml', 'image/webp'],
            });
          }

          const { error: adminErr } = await admin.storage
            .from(BRANDING_BUCKET)
            .upload(storagePath, fileBuffer, {
              contentType: mimeType || 'image/png',
              upsert: true,
            });
          if (adminErr) uploadError = adminErr;
          else uploadError = null;
        } catch (adminEx) {
          uploadError = adminEx;
        }
      }
    } catch (err) {
      uploadError = err;
    }

    if (uploadError) {
      console.error('Supabase logo upload failed:', uploadError);
      throw new Error('Logo gagal disimpan. Periksa koneksi atau konfigurasi penyimpanan dan coba kembali.');
    }

    const supabase = await createClient();
    const { data: publicUrlData } = supabase.storage.from(BRANDING_BUCKET).getPublicUrl(storagePath);
    return { filePath: publicUrlData.publicUrl };
  }

  // Local storage mode (explicit STORAGE_DRIVER="local")
  const brandingDir = path.join(process.cwd(), 'public', 'branding');
  if (!fs.existsSync(brandingDir)) {
    fs.mkdirSync(brandingDir, { recursive: true });
  }

  const targetPath = path.join(brandingDir, uniqueName);
  fs.writeFileSync(targetPath, fileBuffer);

  return { filePath: `/branding/${uniqueName}` };
}

export async function deleteLogoFile(filePath: string): Promise<boolean> {
  if (!filePath) return false;

  if (isSupabaseStorage()) {
    if (filePath.includes(BRANDING_BUCKET) || filePath.includes('/storage/v1/object/')) {
      try {
        const supabase = await createClient();
        const match = filePath.match(new RegExp(`${BRANDING_BUCKET}/([^?]+)`));
        if (match && match[1]) {
          const objectKey = decodeURIComponent(match[1]);
          const { error } = await supabase.storage.from(BRANDING_BUCKET).remove([objectKey]);
          if (error) {
            const admin = createAdminClient();
            await admin.storage.from(BRANDING_BUCKET).remove([objectKey]);
          }
          return true;
        }
      } catch (err) {
        console.error('Error deleting logo from Supabase Storage:', err);
        return false;
      }
    }
    return false;
  }

  // Local storage mode
  if (filePath.startsWith('/branding/')) {
    try {
      const fullPath = path.join(process.cwd(), 'public', filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
    } catch (err) {
      console.error('Error deleting local logo:', err);
    }
  }

  return false;
}

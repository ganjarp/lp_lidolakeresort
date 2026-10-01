import { supabase } from './db';
import { v4 as uuidv4 } from 'uuid';

const BUCKET_NAME = 'uploads';

/**
 * Ensures the 'uploads' bucket exists in Supabase Storage.
 * Creates it as a public bucket if it doesn't exist yet.
 */
async function ensureBucket() {
  const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);
  if (error || !data) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    });
    if (createError && !createError.message.includes('already exists')) {
      throw new Error(`Failed to create storage bucket: ${createError.message}`);
    }
  }
}

/**
 * Upload a file to Supabase Storage.
 * @param file - The File object to upload
 * @param folder - Subfolder within the bucket (e.g. 'avatars', 'links')
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(file: File, folder: string = ''): Promise<string> {
  await ensureBucket();

  const ext = file.name.split('.').pop() || 'png';
  const filename = `${uuidv4()}.${ext}`;
  const filePath = folder ? `${folder}/${filename}` : filename;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: file.type || 'image/png',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Delete a file from Supabase Storage by its public URL.
 * @param publicUrl - The full public URL of the file
 */
export async function deleteFile(publicUrl: string): Promise<void> {
  // Extract the file path from the public URL
  // URL format: https://<project>.supabase.co/storage/v1/object/public/uploads/<path>
  const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) {
    // Not a Supabase storage URL (might be a legacy local path), skip
    return;
  }

  const filePath = publicUrl.substring(idx + marker.length);

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.warn(`Failed to delete file from storage: ${error.message}`);
  }
}

import { supabase } from './supabase';

const MAX_DIMENSION = 1080;
const JPEG_QUALITY = 0.82;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // 25MB

export type UploadResult = {
  url: string;
  mediaType: 'image' | 'video';
  path: string;
};

export type UploadProgress = (pct: number) => void;

function isVideo(file: File): boolean {
  return file.type.startsWith('video/');
}

async function compressImage(file: File): Promise<Blob> {
  // For non-JPEG/PNG or tiny images, just return as-is
  if (!file.type.startsWith('image/')) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Compression failed'))),
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
  bitmap.close?.();
  return blob;
}

function randomId(): string {
  return crypto.randomUUID();
}

export async function uploadMedia(
  file: File,
  folder: 'stories' | 'posts' | 'reels',
  userId: string,
  onProgress?: UploadProgress,
): Promise<UploadResult> {
  const mediaType: 'image' | 'video' = isVideo(file) ? 'video' : 'image';
  let body: Blob = file;

  if (mediaType === 'image') {
    body = await compressImage(file);
  } else if (file.size > MAX_VIDEO_BYTES) {
    throw new Error('Video must be under 25MB');
  }

  const ext = mediaType === 'image' ? 'jpg' : (file.name.split('.').pop() || 'mp4');
  const path = `${folder}/${userId}/${randomId()}.${ext}`;

  onProgress?.(5);

  const { error } = await supabase.storage
    .from('media')
    .upload(path, body, {
      contentType: mediaType === 'image' ? 'image/jpeg' : file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  onProgress?.(85);

  const { data: pub } = supabase.storage.from('media').getPublicUrl(path);
  onProgress?.(100);

  return { url: pub.publicUrl, mediaType, path };
}

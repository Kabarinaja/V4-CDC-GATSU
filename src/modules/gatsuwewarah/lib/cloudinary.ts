export const CLOUDINARY_CLOUD_NAME =
  import.meta.env?.VITE_GATSU_CLOUDINARY_CLOUD_NAME || 'nj6kyxex';
export const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env?.VITE_GATSU_CLOUDINARY_UPLOAD_PRESET || 'celupnews';
export const CLOUDINARY_DEFAULT_FOLDER =
  import.meta.env?.VITE_GATSU_CLOUDINARY_FOLDER || 'celupnews/images';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    return {
      valid: false,
      error: 'Format gambar harus JPG, PNG, WebP, atau AVIF.',
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Ukuran gambar maksimal 5 MB.',
    };
  }
  return { valid: true };
}

export interface CloudinaryOptimizeOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'limit' | 'fit' | 'thumb';
  gravity?: 'auto' | 'face' | 'center';
  quality?: 'auto' | 'auto:good' | 'auto:best';
}

export function optimizeCloudinaryUrl(
  url: string,
  options: CloudinaryOptimizeOptions = {}
): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) {
    return url;
  }

  const transforms: string[] = ['f_auto', `q_${options.quality || 'auto:good'}`];
  if (options.width) transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`);
  if (options.crop) transforms.push(`c_${options.crop}`);
  if (options.gravity) transforms.push(`g_${options.gravity}`);

  const marker = '/image/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  const prefix = url.slice(0, idx + marker.length);
  const rest = url.slice(idx + marker.length);

  // Avoid double-inserting transforms if already transformed
  if (/^[a-z]_[^/]+/.test(rest) && !rest.startsWith('v')) {
    return url;
  }

  return `${prefix}${transforms.join(',')}/${rest}`;
}

export interface CloudinaryUploadResponse {
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
}

export async function uploadImageToCloudinary(
  file: File,
  subfolder?: string
): Promise<CloudinaryUploadResponse> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'File gambar tidak valid.');
  }

  const folder = subfolder
    ? `${CLOUDINARY_DEFAULT_FOLDER}/${subfolder}`.replace(/\/+/g, '/')
    : CLOUDINARY_DEFAULT_FOLDER;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(
      `Gagal mengunggah gambar ke Cloudinary (${response.status}). ${errBody ? errBody.slice(0, 120) : ''}`
    );
  }

  const data = (await response.json()) as {
    secure_url: string;
    public_id: string;
    width: number;
    height: number;
  };

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
  };
}

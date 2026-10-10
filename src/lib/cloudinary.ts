export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "fa7ua9nq";
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "mycdcgatsu";

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  created_at: string;
}

/**
 * Upload an image file or base64 data to Cloudinary via unsigned upload preset
 * @param file File | Blob
 * @param folder 'payment-proofs' | 'promotions' | 'chat-attachments'
 */
export async function uploadToCloudinary(
  file: File | Blob,
  folder: string = 'payment-proofs'
): Promise<string> {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  if (folder) {
    formData.append('folder', folder);
  }

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Cloudinary upload failed:', errText);
    throw new Error('Gagal mengunggah gambar ke server media. Silakan periksa koneksi atau format gambar.');
  }

  const data = (await response.json()) as CloudinaryUploadResult;
  return data.secure_url;
}

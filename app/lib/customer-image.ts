// Shared by the customer image picker (client) and the customer actions (server).
export const CUSTOMER_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];
export const CUSTOMER_IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
export const DEFAULT_CUSTOMER_IMAGE = '/customers/default.png';

// Returns an error message, or null if the file is acceptable.
export function validateCustomerImage(file: { type: string; size: number }) {
  if (!CUSTOMER_IMAGE_TYPES.includes(file.type)) {
    return 'Please choose a PNG, JPEG, WebP or GIF image.';
  }
  if (file.size > CUSTOMER_IMAGE_MAX_BYTES) {
    return 'Image must be 2 MB or smaller.';
  }
  return null;
}

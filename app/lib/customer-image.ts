import type { MessageKey } from '@/app/lib/i18n/translator';

// Shared by the customer image picker (client) and the customer actions (server).
export const CUSTOMER_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];
export const CUSTOMER_IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
export const DEFAULT_CUSTOMER_IMAGE = '/customers/default.png';

// Returns the translation key of the error, or null if the file is acceptable.
// Callers translate it (useTranslations on the client, getTranslations on the server).
export function validateCustomerImage(file: {
  type: string;
  size: number;
}): MessageKey | null {
  if (!CUSTOMER_IMAGE_TYPES.includes(file.type)) {
    return 'customers.errors.imageType';
  }
  if (file.size > CUSTOMER_IMAGE_MAX_BYTES) {
    return 'customers.errors.imageSize';
  }
  return null;
}

// The Blob store is private, so uploaded images are served through this
// authenticated route (app/api/customer-images/[...pathname]/route.ts).
// A customer's image_url is either a seeded static file (/customers/*.png)
// or this prefix followed by the blob's pathname.
export const CUSTOMER_IMAGE_ROUTE = '/api/customer-images/';
export const CUSTOMER_IMAGE_BLOB_FOLDER = 'customers/';

export function isUploadedCustomerImage(imageUrl: string) {
  return imageUrl.startsWith(CUSTOMER_IMAGE_ROUTE);
}

export function blobPathnameFromImageUrl(imageUrl: string) {
  return imageUrl.slice(CUSTOMER_IMAGE_ROUTE.length);
}

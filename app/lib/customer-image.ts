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

export const CUSTOMER_IMAGE_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

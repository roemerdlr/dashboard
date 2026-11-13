import { get } from '@vercel/blob';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { CUSTOMER_IMAGE_BLOB_FOLDER } from '@/app/lib/customer-image';

// Serves customer images from the private Blob store to signed-in users.
// URL: /api/customer-images/customers/avatar-<suffix>.png
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pathname: string[] }> },
) {
  // /api is excluded from proxy.ts, so authenticate here.
  const session = await auth();
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const pathname = (await params).pathname.join('/');
  // Only expose customer images, never other blobs in the store.
  if (
    !pathname.startsWith(CUSTOMER_IMAGE_BLOB_FOLDER) ||
    pathname.includes('..')
  ) {
    return new NextResponse('Not found', { status: 404 });
  }

  const result = await get(pathname, { access: 'private' });
  if (result === null || result.statusCode !== 200) {
    return new NextResponse('Not found', { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      // Uploads get a random suffix and are never overwritten, so the browser
      // can cache them; `private` keeps shared caches/CDNs from storing them.
      'Cache-Control': 'private, max-age=31536000, immutable',
      'Content-Type': result.blob.contentType,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

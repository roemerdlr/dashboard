'use server';

import { z } from 'zod';
import { revalidatePath, updateTag } from 'next/cache';
import { CACHE_TAGS } from '@/app/lib/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { requirePermission } from '@/app/lib/auth-guard';
import { put, del } from '@vercel/blob';
import sharp from 'sharp';
import {
  CUSTOMER_IMAGE_BLOB_FOLDER,
  CUSTOMER_IMAGE_ROUTE,
  DEFAULT_CUSTOMER_IMAGE,
  blobPathnameFromImageUrl,
  isUploadedCustomerImage,
  validateCustomerImage,
} from '@/app/lib/customer-image';
import { getTranslations } from '@/app/lib/i18n/server';
import type { Translator } from '@/app/lib/i18n/translator';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Built per request so validation messages use the request's language.
const InvoiceFormSchema = (t: Translator) =>
  z.object({
    customerId: z.string({
      invalid_type_error: t('invoices.errors.selectCustomer'),
    }),
    amount: z.coerce
      .number()
      .gt(0, { message: t('invoices.errors.amountGreaterThanZero') }),
    status: z.enum(['pending', 'paid'], {
      invalid_type_error: t('invoices.errors.selectStatus'),
    }),
  });

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  await requirePermission('invoices:create');
    const t = await getTranslations();
    // Validate form using Zod
    const validatedFields = InvoiceFormSchema(t).safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: t('invoices.errors.missingFieldsCreate'),
        };
    }

    // Prepare data for insertion into the database
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    // Insert data into the database
    try {
        await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
    } catch (error) {
        // If a database error occurs, return a more specific error.
        return {
            message: t('invoices.errors.databaseCreate'),
        };
    }

    // Revalidate the cache for the invoices page and redirect the user.
    updateTag(CACHE_TAGS.invoices);
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  await requirePermission('invoices:update');
  const t = await getTranslations();
  const validatedFields = InvoiceFormSchema(t).safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: t('invoices.errors.missingFieldsUpdate'),
    };
  }
 
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
 
  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: t('invoices.errors.databaseUpdate') };
  }
 
  updateTag(CACHE_TAGS.invoices);
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  await requirePermission('invoices:delete');
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  updateTag(CACHE_TAGS.invoices);
  revalidatePath('/dashboard/invoices');
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      const t = await getTranslations();
      switch (error.type) {
        case 'CredentialsSignin':
          return t('login.invalidCredentials');
        default:
          return t('login.error');
      }
    }
    throw error;
  }
}

const CustomerFormSchema = (t: Translator) =>
  z.object({
    name: z.string().trim().min(1, { message: t('customers.errors.name') }),
    email: z
      .string()
      .trim()
      .email({ message: t('customers.errors.email') }),
  });

export type CustomerState = {
  errors?: {
    name?: string[];
    email?: string[];
    image?: string[];
  };
  message?: string | null;
};

function revalidateCustomerPages() {
  // Customer names, emails and images also appear on the invoices and overview pages.
  updateTag(CACHE_TAGS.customers);
  revalidatePath('/dashboard/customers');
  revalidatePath('/dashboard/invoices');
  revalidatePath('/dashboard');
}

// Returns the uploaded File, or null when the user didn't pick one
// (an empty file input still submits a 0-byte File).
function getImageFile(formData: FormData) {
  const image = formData.get('image');
  return image instanceof File && image.size > 0 ? image : null;
}

// Avatars are shown at most 64px wide; 256px keeps them sharp on high-DPI screens.
const CUSTOMER_AVATAR_SIZE = 256;

// Resizes the image to a square WebP avatar, uploads it to the private Blob
// store and returns the app URL that serves it. Uploaded images skip the
// Next.js image optimizer (see app/lib/customer-image.ts), so they must be
// stored small.
async function uploadCustomerImage(file: File) {
  const avatar = await sharp(Buffer.from(await file.arrayBuffer()))
    .rotate() // apply the EXIF orientation from phone photos
    .resize(CUSTOMER_AVATAR_SIZE, CUSTOMER_AVATAR_SIZE, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();

  // Fixed, URL-safe name; the random suffix makes it unique.
  const blob = await put(`${CUSTOMER_IMAGE_BLOB_FOLDER}avatar.webp`, avatar, {
    access: 'private',
    addRandomSuffix: true,
    contentType: 'image/webp',
  });
  return `${CUSTOMER_IMAGE_ROUTE}${blob.pathname}`;
}

// Best effort: a leftover blob is only wasted storage, so don't fail the request over it.
// Seeded static images (/customers/*.png) are skipped.
async function deleteCustomerImage(imageUrl: string) {
  if (!isUploadedCustomerImage(imageUrl)) return;
  try {
    await del(blobPathnameFromImageUrl(imageUrl));
  } catch (error) {
    console.error('Failed to delete customer image:', error);
  }
}

function validateCustomerForm(formData: FormData, t: Translator) {
  const validatedFields = CustomerFormSchema(t).safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
  });
  const image = getImageFile(formData);
  const imageError = image ? validateCustomerImage(image) : null;

  if (!validatedFields.success || imageError) {
    return {
      success: false as const,
      errors: {
        ...(validatedFields.success
          ? {}
          : validatedFields.error.flatten().fieldErrors),
        ...(imageError ? { image: [t(imageError)] } : {}),
      },
    };
  }
  return { success: true as const, data: validatedFields.data, image };
}

export async function createCustomer(
  prevState: CustomerState,
  formData: FormData,
) {
  await requirePermission('customers:create');
  const t = await getTranslations();
  const validated = validateCustomerForm(formData, t);
  if (!validated.success) {
    return {
      errors: validated.errors,
      message: t('customers.errors.missingFieldsCreate'),
    };
  }

  const { name, email } = validated.data;

  let imageUrl = DEFAULT_CUSTOMER_IMAGE;
  if (validated.image) {
    try {
      imageUrl = await uploadCustomerImage(validated.image);
    } catch (error) {
      console.error('Image upload failed:', error);
      return { message: t('customers.errors.upload') };
    }
  }

  try {
    await sql`
      INSERT INTO customers (name, email, image_url)
      VALUES (${name}, ${email}, ${imageUrl})
    `;
  } catch (error) {
    await deleteCustomerImage(imageUrl);
    return { message: t('customers.errors.databaseCreate') };
  }

  revalidateCustomerPages();
  redirect('/dashboard/customers');
}

export async function updateCustomer(
  id: string,
  prevState: CustomerState,
  formData: FormData,
) {
  await requirePermission('customers:update');
  const t = await getTranslations();
  const validated = validateCustomerForm(formData, t);
  if (!validated.success) {
    return {
      errors: validated.errors,
      message: t('customers.errors.missingFieldsUpdate'),
    };
  }

  const { name, email } = validated.data;

  if (!validated.image) {
    try {
      await sql`
        UPDATE customers
        SET name = ${name}, email = ${email}
        WHERE id = ${id}
      `;
    } catch (error) {
      return { message: t('customers.errors.databaseUpdate') };
    }
  } else {
    let newImageUrl: string;
    try {
      newImageUrl = await uploadCustomerImage(validated.image);
    } catch (error) {
      console.error('Image upload failed:', error);
      return { message: t('customers.errors.upload') };
    }

    let oldImageUrl: string | undefined;
    try {
      const [old] = await sql<{ image_url: string }[]>`
        SELECT image_url FROM customers WHERE id = ${id}
      `;
      oldImageUrl = old?.image_url;
      await sql`
        UPDATE customers
        SET name = ${name}, email = ${email}, image_url = ${newImageUrl}
        WHERE id = ${id}
      `;
    } catch (error) {
      await deleteCustomerImage(newImageUrl);
      return { message: t('customers.errors.databaseUpdate') };
    }

    // Only remove the previous image once the new one is saved.
    if (oldImageUrl) await deleteCustomerImage(oldImageUrl);
  }

  revalidateCustomerPages();
  redirect('/dashboard/customers');
}

export async function deleteCustomer(id: string) {
  await requirePermission('customers:delete');
  // invoices.customer_id has no foreign key, so guard here to avoid orphaned invoices.
  // The UI disables the button for these customers; this covers stale pages.
  const [{ count }] = await sql`
    SELECT COUNT(*) FROM invoices WHERE customer_id = ${id}
  `;
  if (Number(count) > 0) {
    throw new Error('Cannot delete a customer who still has invoices.');
  }

  const deleted = await sql<{ image_url: string }[]>`
    DELETE FROM customers WHERE id = ${id} RETURNING image_url
  `;
  if (deleted[0]) await deleteCustomerImage(deleted[0].image_url);
  revalidateCustomerPages();
}

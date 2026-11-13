'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { put, del } from '@vercel/blob';
import {
  DEFAULT_CUSTOMER_IMAGE,
  validateCustomerImage,
} from '@/app/lib/customer-image';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce
        .number()
        .gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status.',
    }),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
    // Validate form using Zod
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
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
            message: 'Database Error: Failed to Create Invoice.',
        };
    }

    // Revalidate the cache for the invoices page and redirect the user.
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
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
    return { message: 'Database Error: Failed to Update Invoice.' };
  }
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
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
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

const CustomerFormSchema = z.object({
  name: z.string().trim().min(1, { message: 'Please enter a name.' }),
  email: z
    .string()
    .trim()
    .email({ message: 'Please enter a valid email address.' }),
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

function isBlobUrl(url: string) {
  return url.includes('.blob.vercel-storage.com/');
}

async function uploadCustomerImage(file: File) {
  const blob = await put(`customers/${file.name}`, file, {
    access: 'public',
    addRandomSuffix: true,
    contentType: file.type,
  });
  return blob.url;
}

// Best effort: a leftover blob is only wasted storage, so don't fail the request over it.
async function deleteCustomerImage(url: string) {
  if (!isBlobUrl(url)) return;
  try {
    await del(url);
  } catch (error) {
    console.error('Failed to delete customer image:', error);
  }
}

function validateCustomerForm(formData: FormData) {
  const validatedFields = CustomerFormSchema.safeParse({
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
        ...(imageError ? { image: [imageError] } : {}),
      },
    };
  }
  return { success: true as const, data: validatedFields.data, image };
}

export async function createCustomer(
  prevState: CustomerState,
  formData: FormData,
) {
  const validated = validateCustomerForm(formData);
  if (!validated.success) {
    return {
      errors: validated.errors,
      message: 'Missing Fields. Failed to Create Customer.',
    };
  }

  const { name, email } = validated.data;

  let imageUrl = DEFAULT_CUSTOMER_IMAGE;
  if (validated.image) {
    try {
      imageUrl = await uploadCustomerImage(validated.image);
    } catch (error) {
      console.error('Image upload failed:', error);
      return { message: 'Upload Error: Failed to upload the image.' };
    }
  }

  try {
    await sql`
      INSERT INTO customers (name, email, image_url)
      VALUES (${name}, ${email}, ${imageUrl})
    `;
  } catch (error) {
    await deleteCustomerImage(imageUrl);
    return { message: 'Database Error: Failed to Create Customer.' };
  }

  revalidateCustomerPages();
  redirect('/dashboard/customers');
}

export async function updateCustomer(
  id: string,
  prevState: CustomerState,
  formData: FormData,
) {
  const validated = validateCustomerForm(formData);
  if (!validated.success) {
    return {
      errors: validated.errors,
      message: 'Missing Fields. Failed to Update Customer.',
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
      return { message: 'Database Error: Failed to Update Customer.' };
    }
  } else {
    let newImageUrl: string;
    try {
      newImageUrl = await uploadCustomerImage(validated.image);
    } catch (error) {
      console.error('Image upload failed:', error);
      return { message: 'Upload Error: Failed to upload the image.' };
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
      return { message: 'Database Error: Failed to Update Customer.' };
    }

    // Only remove the previous image once the new one is saved.
    if (oldImageUrl) await deleteCustomerImage(oldImageUrl);
  }

  revalidateCustomerPages();
  redirect('/dashboard/customers');
}

export async function deleteCustomer(id: string) {
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

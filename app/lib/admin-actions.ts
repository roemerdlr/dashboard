'use server';

import bcrypt from 'bcrypt';
import postgres from 'postgres';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requirePermission } from '@/app/lib/auth-guard';
import { isPermission } from '@/app/lib/permissions';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

function isUniqueViolation(error: unknown) {
  return error instanceof postgres.PostgresError && error.code === '23505';
}

// Number of users with a system (Admin) role, optionally excluding one user.
async function countAdmins(excludeUserId?: string) {
  const [{ count }] = await sql`
    SELECT COUNT(*) FROM users
    JOIN roles ON roles.id = users.role_id
    WHERE roles.is_system AND users.id IS DISTINCT FROM ${excludeUserId ?? null}
  `;
  return Number(count);
}

async function isSystemRole(roleId: string | null) {
  if (!roleId) return false;
  const [role] = await sql<{ is_system: boolean }[]>`
    SELECT is_system FROM roles WHERE id = ${roleId}
  `;
  return role?.is_system ?? false;
}

// ---------- Users ----------

const UserFormSchema = z.object({
  name: z.string().trim().min(1, { message: 'Please enter a name.' }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'Please enter a valid email address.' }),
  // '' means "no role": the user can sign in but only sees the overview.
  roleId: z
    .string()
    .uuid({ message: 'Please select a valid role.' })
    .or(z.literal(''))
    .transform((value) => value || null),
  password: z.string(),
});

export type UserState = {
  errors?: {
    name?: string[];
    email?: string[];
    roleId?: string[];
    password?: string[];
  };
  message?: string | null;
};

function parseUserForm(formData: FormData) {
  return UserFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    roleId: formData.get('roleId') ?? '',
    password: formData.get('password') ?? '',
  });
}

const PASSWORD_ERROR = 'Password must be at least 6 characters.';

export async function createUser(
  prevState: UserState,
  formData: FormData,
): Promise<UserState> {
  await requirePermission('users:create');

  const validated = parseUserForm(formData);
  const passwordTooShort =
    validated.success && validated.data.password.length < 6;
  if (!validated.success || passwordTooShort) {
    return {
      errors: {
        ...(validated.success ? {} : validated.error.flatten().fieldErrors),
        ...(passwordTooShort ? { password: [PASSWORD_ERROR] } : {}),
      },
      message: 'Missing Fields. Failed to Create User.',
    };
  }

  const { name, email, roleId, password } = validated.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await sql`
      INSERT INTO users (name, email, password, role_id)
      VALUES (${name}, ${email}, ${hashedPassword}, ${roleId})
    `;
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { errors: { email: ['A user with this email already exists.'] } };
    }
    return { message: 'Database Error: Failed to Create User.' };
  }

  revalidatePath('/dashboard/users');
  revalidatePath('/dashboard/roles');
  redirect('/dashboard/users');
}

export async function updateUser(
  id: string,
  prevState: UserState,
  formData: FormData,
): Promise<UserState> {
  await requirePermission('users:update');

  const validated = parseUserForm(formData);
  // Password is optional on edit: empty keeps the current one.
  const passwordTooShort =
    validated.success &&
    validated.data.password.length > 0 &&
    validated.data.password.length < 6;
  if (!validated.success || passwordTooShort) {
    return {
      errors: {
        ...(validated.success ? {} : validated.error.flatten().fieldErrors),
        ...(passwordTooShort ? { password: [PASSWORD_ERROR] } : {}),
      },
      message: 'Missing Fields. Failed to Update User.',
    };
  }

  const { name, email, roleId, password } = validated.data;

  // Don't let the last administrator lose the Admin role.
  const [current] = await sql<{ role_id: string | null }[]>`
    SELECT role_id FROM users WHERE id = ${id}
  `;
  if (!current) {
    return { message: 'This user no longer exists.' };
  }
  if (
    (await isSystemRole(current.role_id)) &&
    !(await isSystemRole(roleId)) &&
    (await countAdmins(id)) === 0
  ) {
    return {
      errors: {
        roleId: ['This is the last Admin. Give another user the Admin role first.'],
      },
      message: 'Failed to Update User.',
    };
  }

  try {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await sql`
        UPDATE users
        SET name = ${name}, email = ${email}, role_id = ${roleId}, password = ${hashedPassword}
        WHERE id = ${id}
      `;
    } else {
      await sql`
        UPDATE users
        SET name = ${name}, email = ${email}, role_id = ${roleId}
        WHERE id = ${id}
      `;
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { errors: { email: ['A user with this email already exists.'] } };
    }
    return { message: 'Database Error: Failed to Update User.' };
  }

  revalidatePath('/dashboard/users');
  revalidatePath('/dashboard/roles');
  redirect('/dashboard/users');
}

export async function deleteUser(id: string) {
  const currentUser = await requirePermission('users:delete');

  // The UI hides these options; the checks cover stale pages and direct calls.
  if (id === currentUser.id) {
    throw new Error("You can't delete your own account.");
  }
  const [target] = await sql<{ role_id: string | null }[]>`
    SELECT role_id FROM users WHERE id = ${id}
  `;
  if (
    target &&
    (await isSystemRole(target.role_id)) &&
    (await countAdmins(id)) === 0
  ) {
    throw new Error("You can't delete the last Admin.");
  }

  await sql`DELETE FROM users WHERE id = ${id}`;
  revalidatePath('/dashboard/users');
  revalidatePath('/dashboard/roles');
}

// ---------- Roles ----------

const RoleFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Please enter a role name.' })
    .max(255),
  description: z.string().trim().max(1000),
});

export type RoleState = {
  errors?: {
    name?: string[];
    description?: string[];
  };
  message?: string | null;
};

function parseRoleForm(formData: FormData) {
  const validated = RoleFormSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') ?? '',
  });
  // Ignore anything that isn't a known permission.
  const permissions = [
    ...new Set(formData.getAll('permissions').map(String)),
  ].filter(isPermission);
  return { validated, permissions };
}

export async function createRole(
  prevState: RoleState,
  formData: FormData,
): Promise<RoleState> {
  await requirePermission('roles:create');

  const { validated, permissions } = parseRoleForm(formData);
  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Role.',
    };
  }
  const { name, description } = validated.data;

  try {
    await sql.begin(async (tx) => {
      const [role] = await tx<{ id: string }[]>`
        INSERT INTO roles (name, description)
        VALUES (${name}, ${description})
        RETURNING id
      `;
      if (permissions.length > 0) {
        const rows = permissions.map((permission) => ({
          role_id: role.id,
          permission,
        }));
        await tx`INSERT INTO role_permissions ${tx(rows, 'role_id', 'permission')}`;
      }
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { errors: { name: ['A role with this name already exists.'] } };
    }
    return { message: 'Database Error: Failed to Create Role.' };
  }

  revalidatePath('/dashboard/roles');
  redirect('/dashboard/roles');
}

export async function updateRole(
  id: string,
  prevState: RoleState,
  formData: FormData,
): Promise<RoleState> {
  await requirePermission('roles:update');

  if (await isSystemRole(id)) {
    return { message: 'The Admin role cannot be changed.' };
  }

  const { validated, permissions } = parseRoleForm(formData);
  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Role.',
    };
  }
  const { name, description } = validated.data;

  try {
    await sql.begin(async (tx) => {
      await tx`
        UPDATE roles SET name = ${name}, description = ${description}
        WHERE id = ${id}
      `;
      await tx`DELETE FROM role_permissions WHERE role_id = ${id}`;
      if (permissions.length > 0) {
        const rows = permissions.map((permission) => ({
          role_id: id,
          permission,
        }));
        await tx`INSERT INTO role_permissions ${tx(rows, 'role_id', 'permission')}`;
      }
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { errors: { name: ['A role with this name already exists.'] } };
    }
    return { message: 'Database Error: Failed to Update Role.' };
  }

  revalidatePath('/dashboard/roles');
  revalidatePath('/dashboard/users');
  redirect('/dashboard/roles');
}

export async function deleteRole(id: string) {
  await requirePermission('roles:delete');

  // The UI disables delete in these cases; the checks cover stale pages.
  if (await isSystemRole(id)) {
    throw new Error('The Admin role cannot be deleted.');
  }
  const [{ count }] = await sql`
    SELECT COUNT(*) FROM users WHERE role_id = ${id}
  `;
  if (Number(count) > 0) {
    throw new Error('Reassign the users with this role before deleting it.');
  }

  // role_permissions rows are removed by ON DELETE CASCADE.
  await sql`DELETE FROM roles WHERE id = ${id}`;
  revalidatePath('/dashboard/roles');
}

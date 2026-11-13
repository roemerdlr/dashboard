import { cache } from 'react';
import { forbidden, redirect } from 'next/navigation';
import postgres from 'postgres';
import { auth } from '@/auth';
import { isPermission, type Permission } from '@/app/lib/permissions';
import { cachedQuery, CACHE_TAGS } from '@/app/lib/cache';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  roleId: string | null;
  roleName: string | null;
  // System roles (Admin) implicitly have every permission.
  isSystemRole: boolean;
  permissions: Permission[];
};

// Loads a user with their role and permissions. Cached across requests per
// user id; the users/roles tags are invalidated whenever a user or role
// changes, so role changes still apply on the next request.
const loadUserWithPermissions = cachedQuery(
  async (userId: string): Promise<CurrentUser | null> => {
    const [user] = await sql<
      {
        id: string;
        name: string;
        email: string;
        role_id: string | null;
        role_name: string | null;
        is_system: boolean | null;
        permissions: string[] | null;
      }[]
    >`
      SELECT
        users.id,
        users.name,
        users.email,
        users.role_id,
        roles.name AS role_name,
        roles.is_system,
        ARRAY(
          SELECT permission FROM role_permissions
          WHERE role_permissions.role_id = users.role_id
        ) AS permissions
      FROM users
      LEFT JOIN roles ON roles.id = users.role_id
      WHERE users.id = ${userId}
    `;
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.role_id,
      roleName: user.role_name,
      isSystemRole: user.is_system ?? false,
      permissions: (user.permissions ?? []).filter(isPermission),
    };
  },
  'loadUserWithPermissions',
  [CACHE_TAGS.users, CACHE_TAGS.roles],
);

// The signed-in user with their role and permissions. The session cookie only
// provides the id; role and permissions come from the (cached) database
// lookup above. `cache` dedupes the call within one request.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  return loadUserWithPermissions(userId);
});

export function hasPermission(
  user: CurrentUser | null,
  permission: Permission,
): boolean {
  if (!user) return false;
  return user.isSystemRole || user.permissions.includes(permission);
}

// Returns true if the signed-in user has the permission.
export async function can(permission: Permission) {
  return hasPermission(await getCurrentUser(), permission);
}

// Guard for pages and Server Actions. Renders app/forbidden.tsx (403) when
// the user lacks the permission, including when their account was deleted
// while they were still signed in.
export async function requirePermission(permission: Permission) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = await getCurrentUser();
  if (!hasPermission(user, permission)) forbidden();
  return user!;
}

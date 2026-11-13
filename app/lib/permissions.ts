// Access control list: the permissions the code checks.
// Roles (stored in the database) are granted a subset of these.
// A permission is "<resource>:<action>", e.g. "invoices:delete".

export const RESOURCES = ['invoices', 'customers', 'users', 'roles'] as const;
export const ACTIONS = ['read', 'create', 'update', 'delete'] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];
export type Permission = `${Resource}:${Action}`;

export const ALL_PERMISSIONS: Permission[] = RESOURCES.flatMap((resource) =>
  ACTIONS.map((action) => `${resource}:${action}` as const),
);

export function isPermission(value: string): value is Permission {
  return (ALL_PERMISSIONS as string[]).includes(value);
}

// Display labels live in the dictionaries: roles.resources.* and roles.actions.*

// Roles created by /seed. Fixed ids so seeding is idempotent.
// The Admin role is a "system" role: it always has every permission and
// can't be edited or deleted, so there is always a way back in.
export const ADMIN_ROLE_ID = 'a0f1c2d3-0000-4000-8000-000000000001';
export const DEFAULT_ROLES: {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: Permission[];
}[] = [
  {
    id: ADMIN_ROLE_ID,
    name: 'Admin',
    description: 'Full access, including users and roles.',
    isSystem: true,
    permissions: [], // implicit: all permissions
  },
  {
    id: 'a0f1c2d3-0000-4000-8000-000000000002',
    name: 'Editor',
    description: 'Manages invoices and customers.',
    isSystem: false,
    permissions: [
      'invoices:read',
      'invoices:create',
      'invoices:update',
      'invoices:delete',
      'customers:read',
      'customers:create',
      'customers:update',
      'customers:delete',
    ],
  },
  {
    id: 'a0f1c2d3-0000-4000-8000-000000000003',
    name: 'Viewer',
    description: 'Read-only access to invoices and customers.',
    isSystem: false,
    permissions: ['invoices:read', 'customers:read'],
  },
];

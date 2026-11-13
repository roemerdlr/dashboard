'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { RoleForm as RoleFormData } from '@/app/lib/definitions';
import {
  ACTIONS,
  RESOURCES,
  type Permission,
  type Resource,
} from '@/app/lib/permissions';
import { useTranslations } from '@/app/lib/i18n/client';
import { Button } from '@/app/ui/button';
import { createRole, updateRole, RoleState } from '@/app/lib/admin-actions';

// Used for both create (no `role`) and edit (with `role`).
export default function RoleForm({ role }: { role?: RoleFormData }) {
  const t = useTranslations();
  const initialState: RoleState = { message: null, errors: {} };
  const action = role ? updateRole.bind(null, role.id) : createRole;
  const [state, formAction, isPending] = useActionState(action, initialState);

  // Controlled so the checkboxes survive React's form reset after a failed submit.
  const [granted, setGranted] = useState<Set<string>>(
    () => new Set(role?.permissions ?? []),
  );

  function toggle(resource: Resource, action: (typeof ACTIONS)[number]) {
    const permission: Permission = `${resource}:${action}`;
    setGranted((previous) => {
      const next = new Set(previous);
      if (next.has(permission)) {
        next.delete(permission);
        // Without "view" the other actions are unusable, so drop them too.
        if (action === 'read') {
          ACTIONS.forEach((a) => next.delete(`${resource}:${a}`));
        }
      } else {
        next.add(permission);
        // Creating, editing or deleting requires seeing the list.
        next.add(`${resource}:read`);
      }
      return next;
    });
  }

  return (
    <form action={formAction}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Name */}
        <div className="mb-4">
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            {t('common.name')}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder={t('roles.namePlaceholder')}
            defaultValue={role?.name}
            className="block w-full rounded-md border border-gray-200 py-2 text-sm outline-2 placeholder:text-gray-500"
            aria-describedby="name-error"
          />
          <div id="name-error" aria-live="polite" aria-atomic="true">
            {state.errors?.name?.map((error) => (
              <p className="mt-2 text-sm text-red-500" key={error}>
                {error}
              </p>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label htmlFor="description" className="mb-2 block text-sm font-medium">
            {t('roles.description')}
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            placeholder={t('roles.descriptionPlaceholder')}
            defaultValue={role?.description}
            className="block w-full rounded-md border border-gray-200 py-2 text-sm outline-2 placeholder:text-gray-500"
          />
        </div>

        {/* Permissions matrix */}
        <fieldset>
          <legend className="mb-2 block text-sm font-medium">
            {t('roles.permissions')}
          </legend>
          <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {t('roles.resource')}
                  </th>
                  {ACTIONS.map((action) => (
                    <th key={action} scope="col" className="px-4 py-3 text-center font-medium">
                      {t(`roles.actions.${action}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {RESOURCES.map((resource) => (
                  <tr key={resource}>
                    <th scope="row" className="px-4 py-3 text-left font-normal">
                      {t(`roles.resources.${resource}`)}
                    </th>
                    {ACTIONS.map((action) => {
                      const permission = `${resource}:${action}`;
                      return (
                        <td key={action} className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            name="permissions"
                            value={permission}
                            checked={granted.has(permission)}
                            onChange={() => toggle(resource, action)}
                            aria-label={`${t(`roles.actions.${action}`)} ${t(`roles.resources.${resource}`)}`}
                            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {t('roles.matrixHint')}
          </p>
        </fieldset>

        <div aria-live="polite" aria-atomic="true">
          {state.message && (
            <p className="mt-4 text-sm text-red-500">{state.message}</p>
          )}
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/roles"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          {t('common.cancel')}
        </Link>
        <Button type="submit" aria-disabled={isPending}>
          {role ? t('roles.save') : t('roles.create')}
        </Button>
      </div>
    </form>
  );
}

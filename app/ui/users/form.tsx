'use client';

import {
  AtSymbolIcon,
  KeyIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useActionState } from 'react';
import { RoleField, UserForm as UserFormData } from '@/app/lib/definitions';
import { Button } from '@/app/ui/button';
import { createUser, updateUser, UserState } from '@/app/lib/admin-actions';
import { useTranslations } from '@/app/lib/i18n/client';

const inputClass =
  'peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500';
const iconClass =
  'pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900';

function FieldErrors({ id, errors }: { id: string; errors?: string[] }) {
  return (
    <div id={id} aria-live="polite" aria-atomic="true">
      {errors?.map((error) => (
        <p className="mt-2 text-sm text-red-500" key={error}>
          {error}
        </p>
      ))}
    </div>
  );
}

// Used for both create (no `user`) and edit (with `user`).
export default function UserForm({
  user,
  roles,
}: {
  user?: UserFormData;
  roles: RoleField[];
}) {
  const t = useTranslations();
  const initialState: UserState = { message: null, errors: {} };
  const action = user ? updateUser.bind(null, user.id) : createUser;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Name */}
        <div className="mb-4">
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            {t('common.name')}
          </label>
          <div className="relative">
            <input
              id="name"
              name="name"
              type="text"
              placeholder={t('users.namePlaceholder')}
              defaultValue={user?.name}
              className={inputClass}
              aria-describedby="name-error"
            />
            <UserCircleIcon className={iconClass} />
          </div>
          <FieldErrors id="name-error" errors={state.errors?.name} />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            {t('common.email')}
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              placeholder={t('users.emailPlaceholder')}
              defaultValue={user?.email}
              className={inputClass}
              aria-describedby="email-error"
            />
            <AtSymbolIcon className={iconClass} />
          </div>
          <FieldErrors id="email-error" errors={state.errors?.email} />
        </div>

        {/* Role */}
        <div className="mb-4">
          <label htmlFor="roleId" className="mb-2 block text-sm font-medium">
            {t('users.role')}
          </label>
          <div className="relative">
            <select
              id="roleId"
              name="roleId"
              defaultValue={user?.role_id ?? ''}
              className={`${inputClass} cursor-pointer`}
              aria-describedby="roleId-error"
            >
              <option value="">{t('users.noRoleOption')}</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <ShieldCheckIcon className={iconClass} />
          </div>
          <FieldErrors id="roleId-error" errors={state.errors?.roleId} />
        </div>

        {/* Password */}
        <div className="mb-4">
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            {user ? t('users.newPassword') : t('users.password')}
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder={
                user
                  ? t('users.passwordKeepPlaceholder')
                  : t('users.passwordPlaceholder')
              }
              className={inputClass}
              aria-describedby="password-error"
            />
            <KeyIcon className={iconClass} />
          </div>
          <FieldErrors id="password-error" errors={state.errors?.password} />
        </div>

        <div aria-live="polite" aria-atomic="true">
          {state.message && (
            <p className="mt-4 text-sm text-red-500">{state.message}</p>
          )}
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/users"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          {t('common.cancel')}
        </Link>
        <Button type="submit" aria-disabled={isPending}>
          {user ? t('users.save') : t('users.create')}
        </Button>
      </div>
    </form>
  );
}

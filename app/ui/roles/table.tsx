import { LockClosedIcon } from '@heroicons/react/24/outline';
import { fetchRoles } from '@/app/lib/data';
import { can } from '@/app/lib/auth-guard';
import { ALL_PERMISSIONS } from '@/app/lib/permissions';
import { UpdateRole, DeleteRole } from '@/app/ui/roles/buttons';
import { getTranslations } from '@/app/lib/i18n/server';

export default async function RolesTable() {
  const [t, roles, canUpdate, canDelete] = await Promise.all([
    getTranslations(),
    fetchRoles(),
    can('roles:update'),
    can('roles:delete'),
  ]);

  const permissionsLabel = (role: (typeof roles)[number]) =>
    role.is_system
      ? t('roles.allPermissions')
      : t('roles.permissionCount', {
          count: role.permission_count,
          total: ALL_PERMISSIONS.length,
        });

  const usersLabel = (count: number) => t('roles.userCount', { count });

  const actions = (role: (typeof roles)[number]) =>
    role.is_system ? (
      <span
        className="flex items-center gap-1 text-xs text-gray-500"
        title={t('roles.builtInHint')}
      >
        <LockClosedIcon className="h-4 w-4" /> {t('roles.builtIn')}
      </span>
    ) : (
      <>
        {canUpdate && <UpdateRole id={role.id} />}
        {canDelete && (
          <DeleteRole
            id={role.id}
            name={role.name}
            disabledReason={
              role.user_count > 0
                ? t('roles.deleteInUse')
                : undefined
            }
          />
        )}
      </>
    );

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <div className="md:hidden">
            {roles.map((role) => (
              <div key={role.id} className="mb-2 w-full rounded-md bg-white p-4">
                <div className="border-b pb-4">
                  <p className="mb-1 font-medium">{role.name}</p>
                  <p className="text-sm text-gray-500">{role.description}</p>
                </div>
                <div className="flex items-center justify-between pt-4 text-sm">
                  <div>
                    <p>{permissionsLabel(role)}</p>
                    <p className="text-gray-500">{usersLabel(role.user_count)}</p>
                  </div>
                  <div className="flex justify-end gap-2">{actions(role)}</div>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  {t('roles.role')}
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  {t('roles.description')}
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  {t('roles.permissions')}
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  {t('roles.users')}
                </th>
                <th scope="col" className="relative py-3 pl-6 pr-3">
                  <span className="sr-only">{t('common.edit')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {roles.map((role) => (
                <tr
                  key={role.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3 font-medium">
                    {role.name}
                  </td>
                  <td className="px-3 py-3 text-gray-600">{role.description}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {permissionsLabel(role)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {usersLabel(role.user_count)}
                  </td>
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex items-center justify-end gap-3">
                      {actions(role)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

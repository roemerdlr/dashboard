import { fetchUsers } from '@/app/lib/data';
import { can, getCurrentUser } from '@/app/lib/auth-guard';
import { UpdateUser, DeleteUser } from '@/app/ui/users/buttons';
import { RoleBadge } from '@/app/ui/roles/badge';
import { getTranslations } from '@/app/lib/i18n/server';

export default async function UsersTable() {
  const [t, users, currentUser, canUpdate, canDelete] = await Promise.all([
    getTranslations(),
    fetchUsers(),
    getCurrentUser(),
    can('users:update'),
    can('users:delete'),
  ]);

  const actions = (user: (typeof users)[number]) => (
    <>
      {canUpdate && <UpdateUser id={user.id} name={user.name} />}
      {canDelete && (
        <DeleteUser
          id={user.id}
          name={user.name}
          disabledReason={
            user.id === currentUser?.id
              ? t('users.cantDeleteSelf')
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
            {users.map((user) => (
              <div key={user.id} className="mb-2 w-full rounded-md bg-white p-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="mb-1 font-medium">
                      {user.name}
                      {user.id === currentUser?.id && <YouBadge />}
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <RoleBadge name={user.role_name} />
                </div>
                <div className="flex justify-end gap-2 pt-4">{actions(user)}</div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  {t('common.name')}
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  {t('common.email')}
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  {t('users.role')}
                </th>
                <th scope="col" className="relative py-3 pl-6 pr-3">
                  <span className="sr-only">{t('common.edit')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    {user.name}
                    {user.id === currentUser?.id && <YouBadge />}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{user.email}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <RoleBadge name={user.role_name} />
                  </td>
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex justify-end gap-3">{actions(user)}</div>
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

async function YouBadge() {
  const t = await getTranslations();
  return (
    <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
      {t('users.you')}
    </span>
  );
}

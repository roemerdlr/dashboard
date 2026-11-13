import { Metadata } from 'next';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import Form from '@/app/ui/users/form';
import { fetchRoleOptions } from '@/app/lib/data';
import { requirePermission } from '@/app/lib/auth-guard';

export const metadata: Metadata = {
  title: 'Create User',
};

export default async function Page() {
  await requirePermission('users:create');
  const roles = await fetchRoleOptions();

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Users', href: '/dashboard/users' },
          { label: 'Create User', href: '/dashboard/users/create', active: true },
        ]}
      />
      <Form roles={roles} />
    </main>
  );
}

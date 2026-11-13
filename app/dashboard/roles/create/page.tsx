import { Metadata } from 'next';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import Form from '@/app/ui/roles/form';
import { requirePermission } from '@/app/lib/auth-guard';

export const metadata: Metadata = {
  title: 'Create Role',
};

export default async function Page() {
  await requirePermission('roles:create');

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Roles', href: '/dashboard/roles' },
          { label: 'Create Role', href: '/dashboard/roles/create', active: true },
        ]}
      />
      <Form />
    </main>
  );
}

import { Metadata } from 'next';
import { Suspense } from 'react';
import { lusitana } from '@/app/ui/fonts';
import Table from '@/app/ui/roles/table';
import { CreateRole } from '@/app/ui/roles/buttons';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { can, requirePermission } from '@/app/lib/auth-guard';

export const metadata: Metadata = {
  title: 'Roles',
};

export default async function Page() {
  await requirePermission('roles:read');
  const canCreate = await can('roles:create');

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Roles</h1>
        {canCreate && <CreateRole />}
      </div>
      <Suspense fallback={<InvoicesTableSkeleton />}>
        <Table />
      </Suspense>
    </div>
  );
}

import { Metadata } from 'next';
import { Suspense } from 'react';
import { lusitana } from '@/app/ui/fonts';
import Table from '@/app/ui/roles/table';
import { CreateRole } from '@/app/ui/roles/buttons';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { can, requirePermission } from '@/app/lib/auth-guard';
import { getTranslations } from '@/app/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('metadata.roles') };
}

export default async function Page() {
  await requirePermission('roles:read');
  const t = await getTranslations();
  const canCreate = await can('roles:create');

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>{t('roles.title')}</h1>
        {canCreate && <CreateRole />}
      </div>
      <Suspense fallback={<InvoicesTableSkeleton />}>
        <Table />
      </Suspense>
    </div>
  );
}

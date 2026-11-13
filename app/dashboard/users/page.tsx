import { Metadata } from 'next';
import { Suspense } from 'react';
import { lusitana } from '@/app/ui/fonts';
import Table from '@/app/ui/users/table';
import { CreateUser } from '@/app/ui/users/buttons';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { can, requirePermission } from '@/app/lib/auth-guard';
import { getTranslations } from '@/app/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('metadata.users') };
}

export default async function Page() {
  await requirePermission('users:read');
  const t = await getTranslations();
  const canCreate = await can('users:create');

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>{t('users.title')}</h1>
        {canCreate && <CreateUser />}
      </div>
      <Suspense fallback={<InvoicesTableSkeleton />}>
        <Table />
      </Suspense>
    </div>
  );
}

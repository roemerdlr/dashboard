import Pagination from '@/app/ui/pagination';
import Search from '@/app/ui/search';
import Table from '@/app/ui/invoices/table';
import { CreateInvoice } from '@/app/ui/invoices/buttons';
import { lusitana } from '@/app/ui/fonts';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { Suspense } from 'react';
import { fetchInvoicesCount } from '@/app/lib/data';
import { getTotalPages, parsePage, parsePageSize } from '@/app/lib/pagination';
import { Metadata } from 'next';
import { can, requirePermission } from '@/app/lib/auth-guard';
import { getTranslations } from '@/app/lib/i18n/server';
 
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('metadata.invoices') };
}
 
export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  await requirePermission('invoices:read');
  const canCreate = await can('invoices:create');
  const t = await getTranslations();
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const pageSize = parsePageSize(searchParams?.pageSize);
  const totalItems = await fetchInvoicesCount(query);
  const currentPage = parsePage(
    searchParams?.page,
    getTotalPages(totalItems, pageSize),
  );
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>{t('invoices.title')}</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder={t('invoices.search')} />
        {canCreate && <CreateInvoice />}
      </div>
      <Suspense
        key={`${query}|${currentPage}|${pageSize}`}
        fallback={<InvoicesTableSkeleton />}
      >
        <Table query={query} currentPage={currentPage} pageSize={pageSize} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination
          totalItems={totalItems}
          currentPage={currentPage}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}

import { Metadata } from 'next';
import { Suspense } from 'react';
import { lusitana } from '@/app/ui/fonts';
import Search from '@/app/ui/search';
import Table from '@/app/ui/customers/table';
import { CreateCustomer } from '@/app/ui/customers/buttons';
import Pagination from '@/app/ui/pagination';
import { CustomersTableSkeleton } from '@/app/ui/skeletons';
import { fetchCustomersCount } from '@/app/lib/data';
import { getTotalPages, parsePage, parsePageSize } from '@/app/lib/pagination';
import { can, requirePermission } from '@/app/lib/auth-guard';
import { getTranslations } from '@/app/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('metadata.customers') };
}

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  await requirePermission('customers:read');
  const t = await getTranslations();
  const canCreate = await can('customers:create');
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const pageSize = parsePageSize(searchParams?.pageSize);
  const totalItems = await fetchCustomersCount(query);
  const currentPage = parsePage(
    searchParams?.page,
    getTotalPages(totalItems, pageSize),
  );

  return (
    <div className="w-full">
      <h1 className={`${lusitana.className} text-2xl`}>{t('customers.title')}</h1>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder={t('customers.search')} />
        {canCreate && <CreateCustomer />}
      </div>
      <Suspense
        key={`${query}|${currentPage}|${pageSize}`}
        fallback={<CustomersTableSkeleton />}
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

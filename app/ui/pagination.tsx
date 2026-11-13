'use client';

import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useId, useTransition } from 'react';
import { generatePagination } from '@/app/lib/utils';
import { PAGE_SIZES, getTotalPages } from '@/app/lib/pagination';
import { useTranslations } from '@/app/lib/i18n/client';
import { Select } from '@/app/ui/form/element/select';

// Paginator for list pages: "Showing x–y of z", page links and a
// rows-per-page dropdown. Page and size live in the URL (?page=&pageSize=).
//
// - Hidden entirely when every page size fits all results.
// - The page links are hidden when all results fit on one page, but the
//   dropdown stays so a larger size can be switched back.
export default function Pagination({
  totalItems,
  currentPage,
  pageSize,
}: {
  totalItems: number;
  currentPage: number;
  pageSize: number;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const [isPending, startTransition] = useTransition();
  const sizeLabelId = useId();

  if (totalItems <= PAGE_SIZES[0]) return null;

  const totalPages = getTotalPages(totalItems, pageSize);
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const changePageSize = (size: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('pageSize', size);
    params.set('page', '1');
    startTransition(() => replace(`${pathname}?${params.toString()}`));
  };

  const allPages = generatePagination(currentPage, totalPages);

  return (
    <nav
      aria-label={t('pagination.label')}
      className="flex w-full flex-col items-center gap-4 md:flex-row md:justify-between"
    >
      <p className="text-sm text-gray-600" aria-live="polite">
        {t('pagination.showing', { from, to, total: totalItems })}
      </p>

      {totalPages > 1 && (
        <div className="inline-flex">
          <PaginationArrow
            direction="left"
            label={t('pagination.previous')}
            href={createPageURL(currentPage - 1)}
            isDisabled={currentPage <= 1}
          />

          <div className="flex -space-x-px">
            {allPages.map((page, index) => {
              let position: 'first' | 'last' | 'single' | 'middle' | undefined;

              if (index === 0) position = 'first';
              if (index === allPages.length - 1) position = 'last';
              if (allPages.length === 1) position = 'single';
              if (page === '...') position = 'middle';

              return (
                <PaginationNumber
                  key={`${page}-${index}`}
                  href={createPageURL(page)}
                  label={t('pagination.page', { page })}
                  page={page}
                  position={position}
                  isActive={currentPage === page}
                />
              );
            })}
          </div>

          <PaginationArrow
            direction="right"
            label={t('pagination.next')}
            href={createPageURL(currentPage + 1)}
            isDisabled={currentPage >= totalPages}
          />
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span id={sizeLabelId}>{t('pagination.rowsPerPage')}</span>
        <Select
          className="w-20"
          value={String(pageSize)}
          disabled={isPending}
          onChange={changePageSize}
          options={PAGE_SIZES.map((size) => ({
            value: String(size),
            label: String(size),
          }))}
          aria-labelledby={sizeLabelId}
        />
      </div>
    </nav>
  );
}

function PaginationNumber({
  page,
  href,
  label,
  isActive,
  position,
}: {
  page: number | string;
  href: string;
  label: string;
  position?: 'first' | 'last' | 'middle' | 'single';
  isActive: boolean;
}) {
  const className = clsx(
    'flex h-10 w-10 items-center justify-center text-sm border',
    {
      'rounded-l-md': position === 'first' || position === 'single',
      'rounded-r-md': position === 'last' || position === 'single',
      'z-10 bg-blue-600 border-blue-600 text-white': isActive,
      'hover:bg-gray-100': !isActive && position !== 'middle',
      'text-gray-300': position === 'middle',
    },
  );

  if (position === 'middle') {
    return <div className={className}>{page}</div>;
  }
  return isActive ? (
    <div className={className} aria-current="page">
      {page}
    </div>
  ) : (
    <Link href={href} className={className} aria-label={label}>
      {page}
    </Link>
  );
}

function PaginationArrow({
  href,
  label,
  direction,
  isDisabled,
}: {
  href: string;
  label: string;
  direction: 'left' | 'right';
  isDisabled?: boolean;
}) {
  const className = clsx(
    'flex h-10 w-10 items-center justify-center rounded-md border',
    {
      'pointer-events-none text-gray-300': isDisabled,
      'hover:bg-gray-100': !isDisabled,
      'mr-2 md:mr-4': direction === 'left',
      'ml-2 md:ml-4': direction === 'right',
    },
  );

  const icon =
    direction === 'left' ? (
      <ArrowLeftIcon className="w-4" />
    ) : (
      <ArrowRightIcon className="w-4" />
    );

  return isDisabled ? (
    <div className={className} aria-disabled="true">
      {icon}
    </div>
  ) : (
    <Link className={className} href={href} aria-label={label}>
      {icon}
    </Link>
  );
}

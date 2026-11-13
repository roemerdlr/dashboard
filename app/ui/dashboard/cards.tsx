import {
  BanknotesIcon,
  ClockIcon,
  UserGroupIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { fetchCardData } from '@/app/lib/data';
import { getTranslations } from '@/app/lib/i18n/server';

const iconMap = {
  collected: BanknotesIcon,
  customers: UserGroupIcon,
  pending: ClockIcon,
  invoices: InboxIcon,
};

export default async function CardWrapper() {
  const [
    t,
    { numberOfInvoices, numberOfCustomers, totalPaidInvoices, totalPendingInvoices },
  ] = await Promise.all([getTranslations(), fetchCardData()]);

  return (
    <>
      {/* NOTE: Uncomment this code in Chapter 9 */}

      <Card title={t('dashboard.collected')} value={totalPaidInvoices} type="collected" />
      <Card title={t('dashboard.pending')} value={totalPendingInvoices} type="pending" />
      <Card
        title={t('dashboard.totalInvoices')}
        value={numberOfInvoices}
        type="invoices"
      />
      <Card
        title={t('dashboard.totalCustomers')}
        value={numberOfCustomers}
        type="customers"
      />
    </>
  );
}

export function Card({
  title,
  value,
  type,
}: {
  title: string;
  value: number | string;
  type: 'invoices' | 'customers' | 'pending' | 'collected';
}) {
  const Icon = iconMap[type];

  return (
    <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
      <div className="flex p-4">
        {Icon ? <Icon className="h-5 w-5 text-gray-700" /> : null}
        <h3 className="ml-2 text-sm font-medium">{title}</h3>
      </div>
      <p
        className={`${lusitana.className}
          truncate rounded-xl bg-white px-4 py-8 text-center text-2xl`}
      >
        {value}
      </p>
    </div>
  );
}

import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import AcmeLogo from '@/app/ui/acme-logo';
import { PowerIcon } from '@heroicons/react/24/outline';
import { signOut } from '@/auth';
import { can, getCurrentUser } from '@/app/lib/auth-guard';
import { getTranslations } from '@/app/lib/i18n/server';
import LocaleSwitcher from '@/app/ui/locale-switcher';

export default async function SideNav() {
  const [t, user, invoices, customers, users, roles] = await Promise.all([
    getTranslations(),
    getCurrentUser(),
    can('invoices:read'),
    can('customers:read'),
    can('users:read'),
    can('roles:read'),
  ]);
  const allowedHrefs = [
    '/dashboard',
    ...(invoices ? ['/dashboard/invoices'] : []),
    ...(customers ? ['/dashboard/customers'] : []),
    ...(users ? ['/dashboard/users'] : []),
    ...(roles ? ['/dashboard/roles'] : []),
  ];

  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      <Link
        className="mb-2 flex h-20 items-end justify-start rounded-md bg-blue-600 p-4 md:h-40"
        href="/"
        aria-label={t('nav.logo')}
      >
        <div className="w-32 text-white md:w-40">
          <AcmeLogo />
        </div>
      </Link>
      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
        <NavLinks allowedHrefs={allowedHrefs} />
        <div className="hidden h-auto w-full grow rounded-md bg-gray-50 md:block"></div>
        <LocaleSwitcher className="hidden md:flex" />
        {user && (
          <div className="hidden rounded-md bg-gray-50 px-3 py-2 text-sm md:block">
            <p className="truncate font-medium text-gray-900">{user.name}</p>
            <p className="truncate text-xs text-gray-500">
              {user.roleName ?? t('roles.noRole')}
            </p>
          </div>
        )}
        <form action={async () => {
          'use server';
          await signOut({ redirectTo: '/' });
        }}
        >
          <button
            aria-label={t('nav.signOut')}
            className="flex h-[48px] w-full grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3">
            <PowerIcon className="w-6" />
            <div className="hidden md:block">{t('nav.signOut')}</div>
          </button>
        </form>
      </div>
    </div>
  );
}

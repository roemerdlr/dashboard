'use client';

import {
  UserGroupIcon,
  HomeIcon,
  DocumentDuplicateIcon,
  UsersIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useTranslations } from '@/app/lib/i18n/client';
import type { MessageKey } from '@/app/lib/i18n/translator';

// Map of links to display in the side navigation.
// Depending on the size of the application, this would be stored in a database.
const links: { name: MessageKey; href: string; icon: typeof HomeIcon }[] = [
  { name: 'nav.home', href: '/dashboard', icon: HomeIcon },
  {
    name: 'nav.invoices',
    href: '/dashboard/invoices',
    icon: DocumentDuplicateIcon,
  },
  { name: 'nav.customers', href: '/dashboard/customers', icon: UserGroupIcon },
  { name: 'nav.users', href: '/dashboard/users', icon: UsersIcon },
  { name: 'nav.roles', href: '/dashboard/roles', icon: ShieldCheckIcon },
];

// `allowedHrefs` comes from SideNav (a Server Component), which checks the
// user's permissions. Hiding links is only cosmetic: every page also checks.
export default function NavLinks({ allowedHrefs }: { allowedHrefs: string[] }) {
  const pathname = usePathname();
  const t = useTranslations();
  return (
    <>
      {links
        .filter((link) => allowedHrefs.includes(link.href))
        .map((link) => {
          const LinkIcon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={clsx(
                'flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3',
                {
                  'bg-sky-100 text-blue-600': pathname === link.href,
                },
              )}
            >
              <LinkIcon className="w-6" />
              <p className="hidden md:block">{t(link.name)}</p>
            </Link>
          );
        })}
    </>
  );
}

import SideNav from '@/app/ui/dashboard/sidenav';

// Dashboard pages read live data from Postgres, so render them per request
// instead of prerendering at build time (which would query the DB during `next build`).
export const dynamic = 'force-dynamic';
 
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <SideNav />
      </div>
      <div className="grow p-6 md:overflow-y-auto md:p-12">{children}</div>
    </div>
  );
}

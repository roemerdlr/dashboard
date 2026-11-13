import Link from 'next/link';
import { NoSymbolIcon } from '@heroicons/react/24/outline';
import { signOut } from '@/auth';

// Rendered (with a 403 status) when forbidden() is called, i.e. when the
// signed-in user's role lacks the permission a page or action requires.
export default function Forbidden() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-2 p-6 text-center">
      <NoSymbolIcon className="w-10 text-gray-400" />
      <h2 className="text-xl font-semibold">403 Forbidden</h2>
      <p className="text-gray-600">
        Your role doesn&apos;t have permission to access this page.
      </p>
      <div className="mt-4 flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400"
        >
          Go to Dashboard
        </Link>
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/login' });
          }}
        >
          <button className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-200">
            Sign in as someone else
          </button>
        </form>
      </div>
    </main>
  );
}

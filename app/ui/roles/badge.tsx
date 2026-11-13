import clsx from 'clsx';

export function RoleBadge({ name }: { name: string | null }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
        name ? 'bg-gray-100 text-gray-700' : 'bg-yellow-50 text-yellow-800',
      )}
    >
      {name ?? 'No role'}
    </span>
  );
}

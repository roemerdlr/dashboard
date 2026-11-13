'use client';

import { ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useId, useRef } from 'react';
import { useFormStatus } from 'react-dom';

// A trash button that opens a confirmation modal before running `action`.
// Uses the native <dialog>, which provides the backdrop, Esc-to-close and focus trapping.
export function ConfirmDeleteButton({
  action,
  title,
  description,
}: {
  action: () => Promise<void>;
  title: string;
  description: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Every row renders its own dialog, so the title id must be unique.
  const titleId = useId();

  async function confirm() {
    await action();
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-md border p-2 hover:bg-gray-100"
      >
        <span className="sr-only">Delete</span>
        <TrashIcon className="w-5" />
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        // Close when clicking the backdrop (the dialog element itself, outside the panel).
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
        className="w-[calc(100%-2rem)] max-w-md rounded-lg p-0 shadow-xl backdrop:bg-gray-900/50"
      >
        <form action={confirm} className="p-6">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-red-100">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="whitespace-normal text-left">
              <h2
                id={titleId}
                className="text-base font-semibold text-gray-900"
              >
                {title}
              </h2>
              <p className="mt-2 text-sm text-gray-500">{description}</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <CancelButton onClick={() => dialogRef.current?.close()} />
            <ConfirmButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function CancelButton({ onClick }: { onClick: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="button"
      // Focus Cancel first so pressing Enter by accident doesn't delete.
      autoFocus
      disabled={pending}
      onClick={onClick}
      className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
    >
      Cancel
    </button>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-10 items-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  );
}

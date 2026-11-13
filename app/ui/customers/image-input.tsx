'use client';

import { PhotoIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import {
  CUSTOMER_IMAGE_TYPES,
  validateCustomerImage,
} from '@/app/lib/customer-image';
import type { MessageKey } from '@/app/lib/i18n/translator';
import { useTranslations } from '@/app/lib/i18n/client';

// Image picker with drag-and-drop, click-to-browse and a live preview.
// The chosen file lives in a regular <input type="file" name="image">,
// so it is submitted with the surrounding form.
export default function ImageInput({
  currentImageUrl,
  errors,
}: {
  currentImageUrl?: string;
  errors?: string[];
}) {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [clientError, setClientError] = useState<MessageKey | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Free the object URL when it's replaced or the component unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // React resets the form after a form action finishes, which empties the
  // file input. Clear the preview too so it never shows a file that won't be sent.
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const clear = () => {
      setPreviewUrl(null);
      setFileName(null);
    };
    form.addEventListener('reset', clear);
    return () => form.removeEventListener('reset', clear);
  }, []);

  function selectFile(file: File | undefined) {
    const input = inputRef.current;
    if (!input) return;

    if (!file) {
      input.value = '';
      setPreviewUrl(null);
      setFileName(null);
      return;
    }

    const error = validateCustomerImage(file);
    if (error) {
      input.value = '';
      setClientError(error);
      setPreviewUrl(null);
      setFileName(null);
      return;
    }

    setClientError(null);
    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    const input = inputRef.current;
    if (!file || !input) return;

    // Put the dropped file into the real input so the form submits it.
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    selectFile(file);
  }

  const shownImage = previewUrl ?? currentImageUrl;
  const errorMessages = clientError ? [t(clientError)] : errors;

  return (
    <div className="mb-4">
      <span className="mb-2 block text-sm font-medium">
        {t('customers.image.label')}
      </span>
      <div className="flex items-center gap-4">
        {shownImage ? (
          // A plain <img> because previews are local blob: URLs, which next/image can't load.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shownImage}
            alt={t('customers.image.preview')}
            className="h-16 w-16 flex-none rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-gray-200">
            <PhotoIcon className="h-7 w-7 text-gray-400" />
          </div>
        )}

        <label
          htmlFor="image"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={clsx(
            'flex flex-1 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-4 py-6 text-center text-sm transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-blue-500',
            isDragging
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400',
          )}
        >
          <PhotoIcon className="mb-2 h-6 w-6 text-gray-400" />
          {fileName ? (
            <span className="font-medium text-gray-900">{fileName}</span>
          ) : (
            <span>
              <span className="font-medium text-blue-600">
                {t('customers.image.choose')}
              </span>{' '}
              {t('customers.image.orDrag')}
            </span>
          )}
          <span className="mt-1 text-xs text-gray-500">
            {t('customers.image.hint')}
          </span>
          <input
            ref={inputRef}
            id="image"
            name="image"
            type="file"
            accept={CUSTOMER_IMAGE_TYPES.join(',')}
            className="sr-only"
            onChange={(e) => selectFile(e.target.files?.[0])}
            aria-describedby="image-error"
          />
        </label>
      </div>

      {previewUrl && (
        <button
          type="button"
          onClick={() => selectFile(undefined)}
          className="mt-2 text-sm text-gray-600 underline hover:text-gray-900"
        >
          {currentImageUrl
            ? t('customers.image.keepCurrent')
            : t('customers.image.remove')}
        </button>
      )}

      <div id="image-error" aria-live="polite" aria-atomic="true">
        {errorMessages?.map((error) => (
          <p className="mt-2 text-sm text-red-500" key={error}>
            {error}
          </p>
        ))}
      </div>
    </div>
  );
}

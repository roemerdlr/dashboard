'use client';

import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
  type SVGProps,
} from 'react';

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
  // Optional icon or avatar shown before the label (in the list and the button).
  icon?: ReactNode;
};

type SelectProps = {
  options: SelectOption[];
  // Submitted with the surrounding form, like <select name>.
  name?: string;
  // Lets <label htmlFor={id}> name and focus the control, like a native select.
  id?: string;
  // Controlled value. Omit it and use defaultValue for an uncontrolled select.
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  // Shown while the value matches no option (like <option value="" disabled>).
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  // Leading icon, e.g. UserCircleIcon, placed like the icons of the text inputs.
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
};

// The list opens upwards when there is less room than this below the button.
const LIST_MAX_HEIGHT = 240;
// Typing letters jumps to the matching option; the typed text resets after this pause.
const TYPEAHEAD_RESET_MS = 500;

// A styled replacement for <select> built on <details>/<summary>.
//
// - <details open> drives the open state, so the chevron swaps between
//   down and up with CSS only (group-open:).
// - The value is submitted through a hidden input, so it works in forms and
//   Server Actions exactly like <select name>, including form reset.
// - Accessibility follows the WAI-ARIA "select-only listbox" pattern:
//   the summary is a button that opens a listbox, and the active option is
//   tracked with aria-activedescendant.
// - Keyboard: ArrowUp/ArrowDown/Home/End/PageUp/PageDown move, Enter/Space
//   select, Escape closes, letters jump to options (also while closed).
export function Select({
  options,
  name,
  id,
  value,
  defaultValue = '',
  onChange,
  placeholder,
  disabled = false,
  required = false,
  icon: Icon,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: SelectProps) {
  const baseId = useId();
  const listId = `${baseId}-list`;
  const valueId = `${baseId}-value`;
  const ariaLabelId = `${baseId}-label`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typeahead = useRef<{ text: string; timer?: ReturnType<typeof setTimeout> }>({
    text: '',
  });

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = isControlled ? value : internalValue;
  const selectedIndex = options.findIndex((o) => o.value === selectedValue);
  const selected = selectedIndex === -1 ? undefined : options[selectedIndex];

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  // ids of the <label htmlFor={id}> elements, found after mount.
  const [labelIds, setLabelIds] = useState<string | undefined>();

  const enabledIndexes = options
    .map((option, index) => (option.disabled ? -1 : index))
    .filter((index) => index !== -1);

  // ---------- label association (<label htmlFor> doesn't work on <summary>) ----------
  useEffect(() => {
    if (!id || ariaLabelledBy) return;
    const labels = Array.from(
      document.querySelectorAll<HTMLLabelElement>(`label[for="${CSS.escape(id)}"]`),
    );
    if (labels.length === 0) return;
    setLabelIds(
      labels
        .map((label, i) => label.id || (label.id = `${id}-label${i ? `-${i}` : ''}`))
        .join(' '),
    );
    // Clicking the label focuses the control, as it does for a native select.
    const focus = (e: MouseEvent) => {
      e.preventDefault();
      summaryRef.current?.focus();
    };
    labels.forEach((label) => label.addEventListener('click', focus));
    return () => labels.forEach((label) => label.removeEventListener('click', focus));
  }, [id, ariaLabelledBy]);

  const nameIds =
    ariaLabelledBy ?? (ariaLabel ? ariaLabelId : labelIds);

  // ---------- form reset: go back to defaultValue, like a native select ----------
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form || isControlled) return;
    const reset = () => setInternalValue(defaultValue);
    form.addEventListener('reset', reset);
    return () => form.removeEventListener('reset', reset);
  }, [defaultValue, isControlled]);

  // ---------- opening and closing ----------
  function openList() {
    if (disabled || options.length === 0) return;
    setActiveIndex(
      selected && !selected.disabled ? selectedIndex : (enabledIndexes[0] ?? -1),
    );
    setOpen(true);
  }

  function closeList({ focusButton = true } = {}) {
    setOpen(false);
    if (focusButton) summaryRef.current?.focus();
  }

  function commit(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    if (!isControlled) setInternalValue(option.value);
    if (option.value !== selectedValue) onChange?.(option.value);
  }

  // Choose the direction before paint, so the list never flashes in the wrong place.
  useLayoutEffect(() => {
    if (!open || !summaryRef.current) return;
    const rect = summaryRef.current.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    setPlacement(below < LIST_MAX_HEIGHT && rect.top > below ? 'top' : 'bottom');
    listRef.current?.focus({ preventScroll: true });
  }, [open]);

  // Close on a click outside.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!detailsRef.current?.contains(e.target as Node)) {
        closeList({ focusButton: false });
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Keep the active option visible while moving through a long list.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: 'nearest' });
    // optionId only depends on baseId, which never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeIndex]);

  // ---------- keyboard ----------
  function move(from: number, step: number) {
    if (enabledIndexes.length === 0) return -1;
    const position = enabledIndexes.indexOf(from);
    if (position === -1) return step > 0 ? enabledIndexes[0] : enabledIndexes.at(-1)!;
    const next = Math.min(Math.max(position + step, 0), enabledIndexes.length - 1);
    return enabledIndexes[next];
  }

  // Finds the next enabled option whose label starts with the typed text.
  function findByTyping(char: string, from: number) {
    const state = typeahead.current;
    clearTimeout(state.timer);
    state.timer = setTimeout(() => (state.text = ''), TYPEAHEAD_RESET_MS);
    // Repeating one letter cycles through the options starting with it.
    state.text = state.text === char ? char : state.text + char;
    const text = state.text.toLocaleLowerCase();
    const ordered = [
      ...enabledIndexes.filter((i) => i > from),
      ...enabledIndexes.filter((i) => i <= from),
    ];
    const startsWith = (i: number) =>
      options[i].label.toLocaleLowerCase().startsWith(text);
    return state.text.length === 1
      ? ordered.find(startsWith)
      : (enabledIndexes.find((i) => i >= from && startsWith(i)) ??
          ordered.find(startsWith));
  }

  const isPrintable = (e: KeyboardEvent) =>
    e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== ' ';

  function onButtonKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      openList();
    } else if (isPrintable(e)) {
      // Like a native select: typing while closed changes the value.
      const match = findByTyping(e.key, selectedIndex);
      if (match !== undefined) commit(match);
    }
  }

  function onListKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    const actions: Record<string, () => void> = {
      ArrowDown: () => setActiveIndex((i) => move(i, 1)),
      ArrowUp: () => setActiveIndex((i) => move(i, -1)),
      Home: () => setActiveIndex(enabledIndexes[0] ?? -1),
      End: () => setActiveIndex(enabledIndexes.at(-1) ?? -1),
      PageDown: () => setActiveIndex((i) => move(i, 10)),
      PageUp: () => setActiveIndex((i) => move(i, -10)),
      Enter: () => {
        commit(activeIndex);
        closeList();
      },
      ' ': () => {
        commit(activeIndex);
        closeList();
      },
      Escape: () => closeList(),
    };

    if (e.key === 'Tab') {
      // Let focus move on, like a native select.
      closeList({ focusButton: false });
      return;
    }
    const action = actions[e.key];
    if (action) {
      e.preventDefault();
      e.stopPropagation();
      action();
    } else if (isPrintable(e)) {
      const match = findByTyping(e.key, activeIndex);
      if (match !== undefined) setActiveIndex(match);
    }
  }

  return (
    <details
      ref={detailsRef}
      open={open}
      className={clsx('group relative', className)}
      onBlur={(e) => {
        // Focus left the whole control (e.g. Shift+Tab or a click elsewhere).
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) {
          closeList({ focusButton: false });
        }
      }}
    >
      <summary
        ref={summaryRef}
        id={id}
        // We manage the open state ourselves instead of the native toggle,
        // so React state and the [open] attribute never disagree.
        onClick={(e) => {
          e.preventDefault();
          if (open) closeList();
          else openList();
        }}
        onKeyDown={onButtonKeyDown}
        tabIndex={disabled ? -1 : 0}
        // Browsers expose <summary> as a disclosure widget; this control is a
        // button that opens a listbox, like the native select's button.
        role="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={nameIds ? `${nameIds} ${valueId}` : undefined}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-disabled={disabled || undefined}
        aria-required={required || undefined}
        className={clsx(
          'flex w-full list-none items-center gap-2 rounded-md border bg-white py-2 pr-3 text-left text-sm outline-2 outline-offset-0 outline-blue-500 focus-visible:outline [&::-webkit-details-marker]:hidden',
          Icon ? 'pl-10' : 'pl-3',
          ariaInvalid ? 'border-red-500' : 'border-gray-200',
          disabled
            ? 'cursor-not-allowed bg-gray-50 text-gray-400'
            : 'cursor-pointer group-open:border-blue-500',
        )}
      >
        {Icon && (
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 group-open:text-gray-900"
          />
        )}
        <span
          id={valueId}
          className={clsx(
            'flex min-w-0 flex-1 items-center gap-2',
            !selected && 'text-gray-500',
          )}
        >
          {selected?.icon}
          <span className="truncate">{selected?.label ?? placeholder ?? ' '}</span>
        </span>
        {/* Chevron: down when closed, up when open (driven by <details open>). */}
        <ChevronDownIcon
          aria-hidden="true"
          className="h-4 w-4 flex-none text-gray-500 group-open:hidden"
        />
        <ChevronUpIcon
          aria-hidden="true"
          className="hidden h-4 w-4 flex-none text-blue-600 group-open:block"
        />
      </summary>

      {ariaLabel && !ariaLabelledBy && (
        <span id={ariaLabelId} hidden>
          {ariaLabel}
        </span>
      )}

      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        tabIndex={-1}
        aria-labelledby={nameIds}
        aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
        onKeyDown={onListKeyDown}
        style={{ maxHeight: LIST_MAX_HEIGHT }}
        className={clsx(
          'absolute inset-x-0 z-20 overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg outline-none',
          placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1',
        )}
      >
        {options.map((option, index) => {
          const isSelected = index === selectedIndex;
          const isActive = index === activeIndex;
          return (
            <li
              key={option.value}
              id={optionId(index)}
              role="option"
              aria-selected={isSelected}
              aria-disabled={option.disabled || undefined}
              // Keep focus on the list so the keyboard keeps working.
              onMouseDown={(e) => e.preventDefault()}
              onMouseMove={() => !option.disabled && setActiveIndex(index)}
              onClick={() => {
                if (option.disabled) return;
                commit(index);
                closeList();
              }}
              className={clsx(
                'flex items-center gap-2 px-3 py-2',
                option.disabled
                  ? 'cursor-not-allowed text-gray-300'
                  : 'cursor-pointer text-gray-900',
                isActive && 'bg-sky-100 text-blue-600',
                isSelected && 'font-medium',
              )}
            >
              {option.icon}
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {isSelected && (
                <CheckIcon aria-hidden="true" className="h-4 w-4 flex-none text-blue-600" />
              )}
            </li>
          );
        })}
      </ul>

      {/* Carries the value in form submissions. A visually hidden text input
          (not type="hidden") so `required` still triggers native validation.
          Like a native select showing a disabled placeholder, nothing is
          submitted while no option is selected (formData.get() is null). */}
      <input
        ref={inputRef}
        name={disabled || !selected ? undefined : name}
        value={selectedValue}
        required={required}
        disabled={disabled}
        onChange={() => {}}
        onFocus={() => summaryRef.current?.focus()}
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px opacity-0"
      />
    </details>
  );
}

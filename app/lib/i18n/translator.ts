import type { Dictionary } from '@/app/lib/i18n/dictionaries/en';
import { INTL_LOCALES, type Locale } from '@/app/lib/i18n/config';

// A message is a string with {placeholders}, or a plural form chosen by
// the `count` variable using the language's plural rules.
export type PluralMessage = { one: string; other: string };
type Message = string | PluralMessage;

// All dotted keys of the dictionary that point at a message,
// e.g. "invoices.title" or "customers.invoiceCount".
type MessageKeys<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends Message
    ? `${Prefix}${K}`
    : MessageKeys<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type MessageKey = MessageKeys<Dictionary>;
export type TranslationValues = Record<string, string | number>;
export type Translator = (key: MessageKey, values?: TranslationValues) => string;

function isPlural(message: unknown): message is PluralMessage {
  return typeof message === 'object' && message !== null && 'other' in message;
}

export function createTranslator(
  dictionary: Dictionary,
  locale: Locale,
): Translator {
  const pluralRules = new Intl.PluralRules(INTL_LOCALES[locale]);

  return (key, values) => {
    let message: unknown = dictionary;
    for (const part of key.split('.')) {
      message = (message as Record<string, unknown> | undefined)?.[part];
    }

    if (isPlural(message)) {
      const count = Number(values?.count ?? 0);
      message = pluralRules.select(count) === 'one' ? message.one : message.other;
    }
    if (typeof message !== 'string') {
      // Missing translation: show the key so it's easy to spot.
      return key;
    }

    return message.replace(/\{(\w+)\}/g, (match, name: string) =>
      values && name in values ? String(values[name]) : match,
    );
  };
}

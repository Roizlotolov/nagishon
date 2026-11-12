import { ar } from "./ar";
import { en } from "./en";
import { he, type Strings } from "./he";
import { ru } from "./ru";

export type Locale = "he" | "en" | "ar" | "ru";
export type { Strings };
export type StringKey = keyof Strings;

export const LOCALES: Record<Locale, Strings> = { he, en, ar, ru };
export const RTL_LOCALES: readonly Locale[] = ["he", "ar"];

export function resolveLocale(locale: unknown): Locale {
  return typeof locale === "string" && Object.prototype.hasOwnProperty.call(LOCALES, locale) ? (locale as Locale) : "he";
}

export function localeDir(locale: Locale): "rtl" | "ltr" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}

export function getStrings(locale: unknown): Strings {
  return LOCALES[resolveLocale(locale)];
}

/** Looks up a string and substitutes {placeholders}. */
export function t(locale: unknown, key: StringKey, vars?: Record<string, string | number>): string {
  const s = getStrings(locale)[key];
  return vars ? s.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : s;
}

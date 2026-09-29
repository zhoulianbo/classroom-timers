import type { AbstractIntlMessages } from 'next-intl'
import type { Locale } from '@/config/i18n'

type MessageTree = Record<string, unknown>

function isPlainObject(value: unknown): value is MessageTree {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function deepMerge(base: MessageTree, overlay: MessageTree): MessageTree {
  const output: MessageTree = { ...base }
  for (const [key, value] of Object.entries(overlay)) {
    const current = output[key]
    output[key] =
      isPlainObject(current) && isPlainObject(value) ? deepMerge(current, value) : value
  }
  return output
}

async function mergeMessageFiles(
  loaders: Array<() => Promise<{ default: MessageTree }>>,
) {
  const parts = await Promise.all(loaders.map((load) => load().then((mod) => mod.default)))
  return parts.reduce<MessageTree>((acc, part) => deepMerge(acc, part), {})
}

const messageLoaders: Record<Locale, () => Promise<AbstractIntlMessages>> = {
  en: () =>
    mergeMessageFiles([
      () => import('../../messages/en/common.json'),
      () => import('../../messages/en/landing.json'),
      () => import('../../messages/en/pages.json'),
    ]).then((messages) => messages as AbstractIntlMessages),
  zh: () =>
    mergeMessageFiles([
      () => import('../../messages/zh/common.json'),
      () => import('../../messages/zh/landing.json'),
      () => import('../../messages/zh/pages.json'),
    ]).then((messages) => messages as AbstractIntlMessages),
  'zh-hant': () =>
    mergeMessageFiles([
      () => import('../../messages/zh-hant/common.json'),
      () => import('../../messages/zh-hant/landing.json'),
      () => import('../../messages/zh-hant/pages.json'),
    ]).then((messages) => messages as AbstractIntlMessages),
  ja: () =>
    mergeMessageFiles([
      () => import('../../messages/ja/common.json'),
      () => import('../../messages/ja/landing.json'),
      () => import('../../messages/ja/pages.json'),
    ]).then((messages) => messages as AbstractIntlMessages),
  es: () =>
    mergeMessageFiles([
      () => import('../../messages/es/common.json'),
      () => import('../../messages/es/landing.json'),
      () => import('../../messages/es/pages.json'),
    ]).then((messages) => messages as AbstractIntlMessages),
  'pt-br': () =>
    mergeMessageFiles([
      () => import('../../messages/pt-br/common.json'),
      () => import('../../messages/pt-br/landing.json'),
      () => import('../../messages/pt-br/pages.json'),
    ]).then((messages) => messages as AbstractIntlMessages),
  fr: () =>
    mergeMessageFiles([
      () => import('../../messages/fr/common.json'),
      () => import('../../messages/fr/landing.json'),
      () => import('../../messages/fr/pages.json'),
    ]).then((messages) => messages as AbstractIntlMessages),
}

export async function loadMessages(locale: Locale) {
  return messageLoaders[locale]()
}

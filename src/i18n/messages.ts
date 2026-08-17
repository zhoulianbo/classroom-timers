import type { AbstractIntlMessages } from 'next-intl'
import type { Locale } from '@/config/i18n'

const messageLoaders: Record<
  Locale,
  () => Promise<{ default: AbstractIntlMessages }>
> = {
  en: () => import('../../messages/en.json').then(({ default: messages }) => ({
    default: messages as unknown as AbstractIntlMessages,
  })),
  zh: () => import('../../messages/zh.json').then(({ default: messages }) => ({
    default: messages as unknown as AbstractIntlMessages,
  })),
  'zh-hant': () => import('../../messages/zh-hant.json').then(({ default: messages }) => ({
    default: messages as unknown as AbstractIntlMessages,
  })),
  ja: () => import('../../messages/ja.json').then(({ default: messages }) => ({
    default: messages as unknown as AbstractIntlMessages,
  })),
}

export async function loadMessages(locale: Locale) {
  return (await messageLoaders[locale]()).default
}

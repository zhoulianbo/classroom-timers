import type { AbstractIntlMessages } from 'next-intl'
import type { Locale } from '@/config/i18n'

const messageLoaders: Record<
  Locale,
  () => Promise<{ default: AbstractIntlMessages }>
> = {
  en: () => import('../../messages/en.json'),
  zh: () => import('../../messages/zh.json'),
  'zh-hant': () => import('../../messages/zh-hant.json'),
}

export async function loadMessages(locale: Locale) {
  return (await messageLoaders[locale]()).default
}

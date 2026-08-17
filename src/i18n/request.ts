import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'
import { loadMessages } from '@/i18n/messages'
import { routing } from '@/i18n/routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale

  return {
    locale,
    messages: await loadMessages(locale),
  }
})

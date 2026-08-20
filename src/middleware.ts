import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getPathLocale, locales } from '@/config/i18n'

const internalLocaleHeader = 'x-classroom-internal-locale'

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const segments = pathname.split('/').filter(Boolean)

  if (request.headers.get(internalLocaleHeader) === 'en') {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.delete(internalLocaleHeader)
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  if (pathname === '/en' || pathname.startsWith('/en/')) {
    const externalUrl = request.nextUrl.clone()
    externalUrl.pathname = pathname === '/en' ? '/' : pathname.slice(3)
    return NextResponse.redirect(externalUrl, 308)
  }

  if (
    segments.length >= 2 &&
    locales.includes(segments[0] as (typeof locales)[number]) &&
    locales.includes(segments[1] as (typeof locales)[number])
  ) {
    const externalUrl = request.nextUrl.clone()
    externalUrl.pathname = `/${segments.slice(1).join('/')}`
    return NextResponse.redirect(externalUrl, 308)
  }

  if (getPathLocale(pathname)) {
    return NextResponse.next()
  }

  const internalUrl = request.nextUrl.clone()
  internalUrl.pathname = pathname === '/' ? '/en' : `/en${pathname}`
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(internalLocaleHeader, 'en')

  return NextResponse.rewrite(internalUrl, {
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
}

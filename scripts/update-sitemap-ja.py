#!/usr/bin/env python3
"""Regenerate sitemap with one <url> per locale and correct reciprocal hreflang."""
from __future__ import annotations

import re
from pathlib import Path

SITE = 'https://classroomtimers.app'
SITEMAP = Path(__file__).resolve().parents[1] / 'public' / 'sitemap.xml'

FUN_TIMER_PATHS = (
    '/timer/fun-timers',
    '/timer/bomb-timer',
    '/timer/rainbow-timer',
    '/timer/sand-timer',
    '/timer/traffic-light-timer',
    '/timer/candle-timer',
    '/timer/egg-timer',
    '/timer/popcorn-timer',
)

# Build locale paths from a *normalized* (locale-free) path only.
LOCALE_PATHS = {
    'en': lambda p: p or '/',
    'zh-CN': lambda p: '/zh' if p in ('', '/') else f'/zh{p}',
    'zh-Hant': lambda p: '/zh-hant' if p in ('', '/') else f'/zh-hant{p}',
    'ja': lambda p: '/ja' if p in ('', '/') else f'/ja{p}',
    'es': lambda p: '/es' if p in ('', '/') else f'/es{p}',
}


def absolute_url(path: str) -> str:
    if path in ('', '/'):
        return SITE
    return SITE + path


def normalize_path(loc: str) -> str:
    """Strip locale prefixes so `/zh/world-clock` -> `/world-clock`."""
    rel = loc.replace(SITE, '') or '/'
    for prefix in ('/zh-hant', '/zh', '/ja', '/es'):
        if rel == prefix:
            return '/'
        if rel.startswith(prefix + '/'):
            return rel[len(prefix) :]
    return rel


def locale_from_loc(loc: str) -> str:
    rel = loc.replace(SITE, '') or '/'
    if rel.startswith('/zh-hant'):
        return 'zh-Hant'
    if rel.startswith('/zh'):
        return 'zh-CN'
    if rel.startswith('/ja'):
        return 'ja'
    if rel.startswith('/es'):
        return 'es'
    return 'en'


def build_url_block(
    loc_path: str,
    base_path: str,
    lastmod: str,
    changefreq: str,
    priority: str,
) -> str:
    """One sitemap entry: <loc> is this locale; hreflang always from base_path."""
    lines = [
        '  <url>',
        f'    <loc>{absolute_url(loc_path)}</loc>',
        f'    <lastmod>{lastmod}</lastmod>',
        f'    <changefreq>{changefreq}</changefreq>',
        f'    <priority>{priority}</priority>',
    ]
    for hreflang, builder in LOCALE_PATHS.items():
        href = absolute_url(builder(base_path))
        # Keep trailing slash only on English home alternate for consistency
        # with historical sitemap (en home href ends with /).
        if hreflang == 'en' and base_path in ('', '/'):
            href = SITE + '/'
        lines.append(
            f'    <xhtml:link rel="alternate" hreflang="{hreflang}" href="{href}" />'
        )
    x_default = SITE + '/' if base_path in ('', '/') else absolute_url(LOCALE_PATHS['en'](base_path))
    lines.append(
        f'    <xhtml:link rel="alternate" hreflang="x-default" href="{x_default}" />'
    )
    lines.append('  </url>')
    return '\n'.join(lines)


def main() -> None:
    text = SITEMAP.read_text(encoding='utf-8')
    url_pattern = re.compile(
        r'  <url>\s*'
        r'<loc>(https://classroomtimers\.app[^<]*)</loc>\s*'
        r'<lastmod>([^<]*)</lastmod>\s*'
        r'<changefreq>([^<]*)</changefreq>\s*'
        r'<priority>([^<]*)</priority>\s*'
        r'(?:\s*<xhtml:link[^>]*/>\s*)*'
        r'</url>',
        re.MULTILINE,
    )

    seen_paths: set[str] = set()
    entries: list[tuple[str, str, str, str]] = []

    # Prefer English <loc> rows for lastmod/changefreq/priority metadata.
    for match in url_pattern.finditer(text):
        loc, lastmod, changefreq, priority = match.groups()
        if locale_from_loc(loc) != 'en':
            continue
        path = normalize_path(loc)
        if path in seen_paths:
            continue
        seen_paths.add(path)
        entries.append((path, lastmod, changefreq, priority))

    for path in FUN_TIMER_PATHS:
        if path in seen_paths:
            continue
        seen_paths.add(path)
        entries.append((path, '2026-08-25', 'monthly', '0.8'))

    blocks: list[str] = []
    for path, lastmod, changefreq, priority in entries:
        # Google: separate <url> for every language version; identical alternate set.
        for builder in (
            LOCALE_PATHS['en'],
            LOCALE_PATHS['zh-CN'],
            LOCALE_PATHS['zh-Hant'],
            LOCALE_PATHS['ja'],
            LOCALE_PATHS['es'],
        ):
            blocks.append(
                build_url_block(builder(path), path, lastmod, changefreq, priority)
            )

    header = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
        '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    )
    footer = '</urlset>\n'

    out = header + '\n'.join(blocks) + '\n' + footer
    SITEMAP.write_text(out, encoding='utf-8')
    print(
        f'Updated {SITEMAP} with {len(entries)} base paths '
        f'({len(blocks)} url entries = {len(entries)} × 5 locales)'
    )


if __name__ == '__main__':
    main()

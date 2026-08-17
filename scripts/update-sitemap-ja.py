#!/usr/bin/env python3
"""Add Japanese locale URLs and hreflang links to public/sitemap.xml."""
from __future__ import annotations

import re
from pathlib import Path

SITE = 'https://classroomtimers.app'
SITEMAP = Path(__file__).resolve().parents[1] / 'public' / 'sitemap.xml'

LOCALE_PATHS = {
    'en': lambda p: p or '/',
    'zh-CN': lambda p: '/zh' if p in ('', '/') else f'/zh{p}',
    'zh-Hant': lambda p: '/zh-hant' if p in ('', '/') else f'/zh-hant{p}',
    'ja': lambda p: '/ja' if p in ('', '/') else f'/ja{p}',
}


def normalize_path(loc: str) -> str:
    rel = loc.replace(SITE, '') or '/'
    for prefix in ('/zh-hant', '/zh', '/ja'):
        if rel == prefix:
            return '/'
        if rel.startswith(prefix + '/'):
            return rel[len(prefix):]
    return rel


def locale_from_loc(loc: str) -> str:
    rel = loc.replace(SITE, '') or '/'
    if rel.startswith('/zh-hant'):
        return 'zh-Hant'
    if rel.startswith('/zh'):
        return 'zh-CN'
    if rel.startswith('/ja'):
        return 'ja'
    return 'en'


def build_url_block(path: str, lastmod: str, changefreq: str, priority: str) -> str:
    loc = SITE + ('' if path == '/' else path)
    lines = [
        '  <url>',
        f'    <loc>{loc}</loc>',
        f'    <lastmod>{lastmod}</lastmod>',
        f'    <changefreq>{changefreq}</changefreq>',
        f'    <priority>{priority}</priority>',
    ]
    for hreflang, builder in LOCALE_PATHS.items():
        href = SITE + builder(path)
        lines.append(
            f'    <xhtml:link rel="alternate" hreflang="{hreflang}" href="{href}" />'
        )
    lines.append(
        f'    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE + LOCALE_PATHS["en"](path)}" />'
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

    for match in url_pattern.finditer(text):
        loc, lastmod, changefreq, priority = match.groups()
        path = normalize_path(loc)
        locale = locale_from_loc(loc)
        if locale != 'en':
            continue
        if path in seen_paths:
            continue
        seen_paths.add(path)
        entries.append((path, lastmod, changefreq, priority))

    blocks = [build_url_block(path, lastmod, changefreq, priority) for path, lastmod, changefreq, priority in entries]

    # Also emit localized primary loc entries (zh, zh-hant, ja) like existing sitemap
    localized_blocks: list[str] = []
    for path, lastmod, changefreq, priority in entries:
        for locale_key, builder in [('zh-CN', LOCALE_PATHS['zh-CN']), ('zh-Hant', LOCALE_PATHS['zh-Hant']), ('ja', LOCALE_PATHS['ja'])]:
            localized_path = builder(path)
            localized_blocks.append(build_url_block(localized_path.replace(SITE, '') if localized_path.startswith(SITE) else localized_path, lastmod, changefreq, priority))

    # Fix localized path building
    localized_blocks = []
    for path, lastmod, changefreq, priority in entries:
        for builder in (LOCALE_PATHS['zh-CN'], LOCALE_PATHS['zh-Hant'], LOCALE_PATHS['ja']):
            localized_blocks.append(build_url_block(builder(path), lastmod, changefreq, priority))

    header = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
        '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    )
    footer = '</urlset>\n'

    out = header + '\n'.join(blocks + localized_blocks) + '\n' + footer
    SITEMAP.write_text(out, encoding='utf-8')
    print(f'Updated {SITEMAP} with {len(entries)} base paths ({len(blocks + localized_blocks)} url entries)')


if __name__ == '__main__':
    main()

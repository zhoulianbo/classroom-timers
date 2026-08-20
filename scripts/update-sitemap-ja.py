#!/usr/bin/env python3
"""Regenerate a normalized sitemap with stable hreflang alternates."""
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
    normalized_path = normalize_path(path)
    loc = SITE + ('' if normalized_path == '/' else normalized_path)
    lines = [
        '  <url>',
        f'    <loc>{loc}</loc>',
        f'    <lastmod>{lastmod}</lastmod>',
        f'    <changefreq>{changefreq}</changefreq>',
        f'    <priority>{priority}</priority>',
    ]
    for hreflang, builder in LOCALE_PATHS.items():
        href = SITE + builder(normalized_path)
        lines.append(
            f'    <xhtml:link rel="alternate" hreflang="{hreflang}" href="{href}" />'
        )
    lines.append(
        f'    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE + LOCALE_PATHS["en"](normalized_path)}" />'
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

    blocks = [
        build_url_block(path, lastmod, changefreq, priority)
        for path, lastmod, changefreq, priority in entries
    ]

    header = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
        '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    )
    footer = '</urlset>\n'

    out = header + '\n'.join(blocks) + '\n' + footer
    SITEMAP.write_text(out, encoding='utf-8')
    print(f'Updated {SITEMAP} with {len(entries)} canonical url entries')


if __name__ == '__main__':
    main()

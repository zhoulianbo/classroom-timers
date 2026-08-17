import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const SITE_URL = 'https://classroomtimers.app';
const KEY_FILE = 'public/8dc1e9b3562941aa90ac0092ee862d1d.txt';
const SITEMAP_FILE = 'public/sitemap.xml';
const MAX_URLS_PER_REQUEST = 10_000;
const isDryRun = process.argv.includes('--dry-run');

function hasConfiguredProxy() {
  return Boolean(
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.ALL_PROXY ||
    process.env.https_proxy ||
    process.env.http_proxy ||
    process.env.all_proxy
  );
}

function requestWithCurl(url, init = {}) {
  const statusMarker = '__INDEXNOW_HTTP_STATUS__:';
  const args = [
    '--silent',
    '--show-error',
    '--location',
    '--retry',
    '3',
    '--retry-all-errors',
    '--retry-delay',
    '1',
    '--request',
    init.method || 'GET',
    '--write-out',
    `\n${statusMarker}%{http_code}`,
  ];

  for (const [name, value] of Object.entries(init.headers || {})) {
    args.push('--header', `${name}: ${value}`);
  }

  if (init.body !== undefined) {
    args.push('--data-binary', '@-');
  }

  args.push(url);

  const result = spawnSync('curl', args, {
    encoding: 'utf8',
    input: init.body,
    maxBuffer: 1024 * 1024,
  });

  if (result.error) {
    throw new Error(`Unable to run curl: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(
      `curl request failed: ${result.stderr.trim() || `exit code ${result.status}`}`
    );
  }

  const markerIndex = result.stdout.lastIndexOf(`\n${statusMarker}`);
  if (markerIndex === -1) {
    throw new Error('Unable to read the HTTP status returned by curl.');
  }

  const responseBody = result.stdout.slice(0, markerIndex);
  const status = Number(
    result.stdout.slice(markerIndex + statusMarker.length + 1).trim()
  );

  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return responseBody;
    },
  };
}

async function request(url, init = {}) {
  try {
    return await fetch(url, init);
  } catch (error) {
    if (!hasConfiguredProxy()) {
      const cause = error instanceof Error && error.cause;
      const detail =
        cause && typeof cause === 'object' && 'code' in cause
          ? ` (${cause.code})`
          : '';
      throw new Error(`Network request failed${detail}: ${url}`, {
        cause: error,
      });
    }

    console.warn(`Native fetch failed; retrying through curl proxy: ${url}`);
    return requestWithCurl(url, init);
  }
}

function decodeXmlText(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

function getSitemapUrls(xml, siteOrigin) {
  const urls = Array.from(xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi), (match) =>
    decodeXmlText(match[1].trim())
  );
  const uniqueUrls = [...new Set(urls)];

  if (uniqueUrls.length === 0) {
    throw new Error('No <loc> URLs were found in the sitemap.');
  }

  for (const value of uniqueUrls) {
    const url = new URL(value);
    if (url.origin !== siteOrigin) {
      throw new Error(
        `Sitemap URL must use the configured site origin ${siteOrigin}: ${value}`
      );
    }
  }

  return uniqueUrls;
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function verifyPublishedKey(keyLocation, expectedKey) {
  const response = await request(keyLocation, {
    headers: { 'user-agent': 'PixelListing-IndexNow/1.0' },
  });

  if (!response.ok) {
    throw new Error(
      `IndexNow key file is not publicly available: ${keyLocation} (HTTP ${response.status})`
    );
  }

  const publishedKey = (await response.text()).trim();
  if (publishedKey !== expectedKey) {
    throw new Error(
      `Published IndexNow key does not match ${path.basename(KEY_FILE)}.`
    );
  }
}

async function submitUrlBatch({ host, key, keyLocation, urlList }) {
  const response = await request(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'user-agent': 'PixelListing-IndexNow/1.0',
    },
    body: JSON.stringify({ host, key, keyLocation, urlList }),
  });

  if (response.status !== 200 && response.status !== 202) {
    const responseBody = (await response.text()).trim();
    throw new Error(
      `IndexNow submission failed with HTTP ${response.status}${responseBody ? `: ${responseBody.slice(0, 500)}` : ''
      }`
    );
  }

  return response.status;
}

async function main() {
  const projectRoot = process.cwd();
  const siteUrl = new URL(SITE_URL);
  const siteOrigin = siteUrl.origin;
  const keyFilePath = path.resolve(projectRoot, KEY_FILE);
  const sitemapFilePath = path.resolve(projectRoot, SITEMAP_FILE);
  const key = (await readFile(keyFilePath, 'utf8')).trim();

  if (!/^[a-fA-F0-9]{8,128}$/.test(key)) {
    throw new Error('IndexNow key must contain 8-128 hexadecimal characters.');
  }

  const sitemapXml = await readFile(sitemapFilePath, 'utf8');
  const urls = getSitemapUrls(sitemapXml, siteOrigin);
  const keyLocation = new URL(path.basename(keyFilePath), `${siteOrigin}/`)
    .href;

  console.log(`Site: ${siteOrigin}`);
  console.log(`Sitemap: ${SITEMAP_FILE}`);
  console.log(`Key location: ${keyLocation}`);
  console.log(`URLs found: ${urls.length}`);

  if (isDryRun) {
    console.log('Dry run complete. No URLs were submitted.');
    return;
  }

  await verifyPublishedKey(keyLocation, key);

  const batches = chunk(urls, MAX_URLS_PER_REQUEST);
  for (let index = 0; index < batches.length; index += 1) {
    const urlList = batches[index];
    const status = await submitUrlBatch({
      host: siteUrl.host,
      key,
      keyLocation,
      urlList,
    });

    console.log(
      `Submitted batch ${index + 1}/${batches.length}: ${urlList.length} URLs (HTTP ${status}).`
    );
  }

  console.log(`IndexNow submission complete: ${urls.length} URLs submitted.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

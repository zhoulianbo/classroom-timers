export const MAX_ROOM_NAME_LENGTH = 60

const CONTROL_AND_INVISIBLE =
  /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g

const URI_SCHEME =
  /(?:^|[^a-z0-9])(?:javascript|data|vbscript|file|blob|https?|ftp|mailto)\s*:/i

const WWW_PREFIX = /(?:^|[^a-z0-9])www\./i

const HTML_OR_SCRIPT =
  /<|>|<\/?[a-z]|on(?:error|load|click|mouseover|focus|submit)\s*=|&(?:lt|gt|quot|#)/i

const MARKDOWN_OR_BBCODE = /\[[^\]]*]\(\s*[^)]+\)|\[[a-z]+=/i

const SPAM_TLDS =
  'com|net|org|io|app|dev|xyz|info|biz|cc|tv|link|click|top|shop|online|site|vip|icu|tk|ml|ga|cf|ly|to|page|cloud|fun|live|blog|store|club|win|zip|mov|rest|lol|work|space|website|tech|digital|today|guru|host|press|news|media|video|game|games|casino'

const DOMAIN_LIKE = new RegExp(`(?:[a-z0-9-]+\\.)+(?:${SPAM_TLDS})\\b`, 'i')

const IPV4 = /\b(?:\d{1,3}\.){3}\d{1,3}\b/

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i

function decodeOnce(value: string) {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '))
  } catch {
    return value
  }
}

export function normalizeRoomName(input: string) {
  return input
    .normalize('NFKC')
    .replace(CONTROL_AND_INVISIBLE, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function roomNameLooksUnsafe(name: string) {
  const decoded = decodeOnce(name)
  const samples = [name, decoded, name.replace(/\s+/g, ''), decoded.replace(/\s+/g, '')]
  return samples.some(
    (sample) =>
      sample.includes('://') ||
      URI_SCHEME.test(sample) ||
      WWW_PREFIX.test(sample) ||
      HTML_OR_SCRIPT.test(sample) ||
      MARKDOWN_OR_BBCODE.test(sample) ||
      DOMAIN_LIKE.test(sample) ||
      IPV4.test(sample) ||
      EMAIL.test(sample),
  )
}

export function parseRoomName(input: string) {
  const name = normalizeRoomName(input)
  if (!name || name.length > MAX_ROOM_NAME_LENGTH || roomNameLooksUnsafe(name)) {
    return null
  }
  return name
}

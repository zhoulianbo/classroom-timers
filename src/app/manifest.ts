import en from '../../messages/en/common.json'
import { buildManifest } from '@/config/manifest'

export default function manifest() {
  return buildManifest(en.manifest.description, '/')
}

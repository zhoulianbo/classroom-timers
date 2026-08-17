import en from '../../messages/en.json'
import { buildManifest } from '@/config/manifest'

export default function manifest() {
  return buildManifest(en.manifest.description, '/')
}

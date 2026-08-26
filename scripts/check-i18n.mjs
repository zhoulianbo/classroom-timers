import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import ts from 'typescript'

const root = path.resolve(import.meta.dirname, '..')
const locales = ['en', 'zh', 'zh-hant', 'ja', 'es']
const messagesDir = path.join(root, 'messages')
const srcDir = path.join(root, 'src')

const errors = []

function flatten(value, prefix = '', output = new Map()) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => flatten(item, `${prefix}.${index}`, output))
    return output
  }

  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, output)
    }
    return output
  }

  output.set(prefix, value)
  return output
}

const messageTrees = new Map()
for (const locale of locales) {
  const file = path.join(messagesDir, `${locale}.json`)
  if (!fs.existsSync(file)) {
    errors.push(`缺少消息文件：messages/${locale}.json`)
    continue
  }

  try {
    messageTrees.set(locale, flatten(JSON.parse(fs.readFileSync(file, 'utf8'))))
  } catch (error) {
    errors.push(`messages/${locale}.json 不是有效 JSON：${error.message}`)
  }
}

const reference = messageTrees.get('en')
if (reference) {
  for (const locale of locales.slice(1)) {
    const candidate = messageTrees.get(locale)
    if (!candidate) continue

    for (const key of reference.keys()) {
      if (!candidate.has(key)) errors.push(`${locale} 缺少 key：${key}`)
    }
    for (const key of candidate.keys()) {
      if (!reference.has(key)) errors.push(`${locale} 存在多余 key：${key}`)
    }

    for (const [key, value] of reference) {
      if (
        typeof value === 'string' &&
        value.length >= 40 &&
        candidate.get(key) === value &&
        !/^(?:https?:\/\/|\/)/.test(value)
      ) {
        errors.push(`${locale} 疑似未翻译：${key}`)
      }
    }
  }
}

const expectedMessageFiles = new Set(locales.map((locale) => `${locale}.json`))
for (const entry of fs.readdirSync(messagesDir, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.json') && !expectedMessageFiles.has(entry.name)) {
    errors.push(`messages 目录存在未注册 locale：${entry.name}`)
  }
}

const ignoredFiles = new Set([
  'src/config/i18n.ts',
  'src/config/site.ts',
  'src/i18n/messages.ts',
  'src/app/metadata.ts',
  'src/components/layout/brand-logo.tsx',
])

const visibleObjectKeys = new Set([
  'a',
  'description',
  'faqTitle',
  'heading',
  'intro',
  'label',
  'name',
  'q',
  'relatedIntro',
  'relatedTitle',
  'sourcesTitle',
  'title',
  'country',
])

const visibleJsxAttributes = new Set(['alt', 'aria-label', 'placeholder', 'title'])
const technicalLiterals = new Set([
  'ClassroomTimers',
  'Web Browser',
  'EducationalApplication',
  'UtilitiesApplication',
  'SportsApplication',
  'Organization',
  'ImageObject',
  'WebSite',
  'WebApplication',
  'Offer',
  'FAQPage',
  'Question',
  'Answer',
  'USD',
  'UTC',
])

function isHumanText(value) {
  const text = value.trim()
  if (!text || technicalLiterals.has(text)) return false
  if (/^(?:https?:\/\/|\/(?!\/)|[A-Za-z]+\/[A-Za-z]|[A-Za-z]+_[A-Za-z]+$)/.test(text)) return false
  if (/^[\d\s:./×+\-–—%]+$/.test(text)) return false
  return /[\p{L}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(text)
}

function getPropertyName(node) {
  if (!node) return ''
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text
  return ''
}

function lineAndColumn(sourceFile, node) {
  const point = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  return `${point.line + 1}:${point.character + 1}`
}

function walkFiles(directory) {
  const files = []
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkFiles(absolute))
    } else if (/\.(?:ts|tsx)$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) {
      files.push(absolute)
    }
  }
  return files
}

for (const file of walkFiles(srcDir)) {
  const relative = path.relative(root, file).split(path.sep).join('/')
  if (ignoredFiles.has(relative)) continue

  const text = fs.readFileSync(file, 'utf8')
  const sourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )

  function report(node, value, reason) {
    errors.push(`${relative}:${lineAndColumn(sourceFile, node)} ${reason}：${JSON.stringify(value)}`)
  }

  function visit(node, localeBranch = false) {
    let insideLocaleBranch = localeBranch
    const localeCondition = ts.isIfStatement(node)
      ? node.expression
      : ts.isConditionalExpression(node)
        ? node.condition
        : undefined

    if (
      localeCondition &&
      /(?:\blocale\s*===|isChineseLocale\s*\()/.test(localeCondition.getText(sourceFile))
    ) {
      insideLocaleBranch = true
    }

    if (ts.isJsxText(node) && isHumanText(node.text)) {
      report(node, node.text.trim(), 'JSX 用户文案必须使用翻译 key')
    }

    if (ts.isJsxAttribute(node) && visibleJsxAttributes.has(node.name.text)) {
      const initializer = node.initializer
      if (initializer && ts.isStringLiteral(initializer) && isHumanText(initializer.text)) {
        report(initializer, initializer.text, `${node.name.text} 用户文案必须使用翻译 key`)
      }
    }

    if (ts.isPropertyAssignment(node)) {
      const key = getPropertyName(node.name)
      if (
        visibleObjectKeys.has(key) &&
        ts.isStringLiteralLike(node.initializer) &&
        isHumanText(node.initializer.text)
      ) {
        report(node.initializer, node.initializer.text, `${key} 用户文案必须使用翻译 key`)
      }
    }

    if (insideLocaleBranch && ts.isStringLiteralLike(node) && isHumanText(node.text)) {
      report(node, node.text, '禁止在 locale 分支中硬编码用户文案')
    }

    ts.forEachChild(node, (child) => visit(child, insideLocaleBranch))
  }

  visit(sourceFile)
}

if (errors.length) {
  console.error(`i18n 检查失败（${errors.length} 项）：`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`i18n 检查通过：${locales.length} 个 locale key 一致，源码未发现硬编码用户文案。`)

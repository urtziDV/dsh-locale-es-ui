#!/usr/bin/env node
/**
 * Checks the pack before it is packed or published:
 *
 *   1. key parity with the reference corpus (data/en.json), in both directions;
 *   2. identical `{placeholder}` sets per key;
 *   3. no missing translation where English carries text;
 *   4. no typographic quotes (the harness copy uses straight quotes);
 *   5. the built browser half really carries the dictionaries on disk;
 *   6. the Loader row name matches the package name.
 *
 * Exits non-zero on the first category that fails, printing every offender.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')
const readJson = (rel) => JSON.parse(read(rel))

const pkg = readJson('package.json')
const language = readJson('data/language.json')
const es = readJson('data/es.json')
const en = readJson('data/en.json')

const problems = []
const placeholders = (value) => (value.match(/\{[^}]*\}/g) ?? []).sort().join('|')

let strings = 0
let copied = 0
for (const [ns, dict] of Object.entries(en)) {
  const translated = es[ns]
  if (!translated) {
    problems.push(`namespace sin traducir: ${ns}`)
    continue
  }
  for (const [key, english] of Object.entries(dict)) {
    strings += 1
    const spanish = translated[key]
    if (typeof spanish !== 'string') {
      problems.push(`clave sin traducir: ${ns}.${key}`)
      continue
    }
    if (spanish === english) copied += 1
    if (spanish.length === 0 && english.length > 0) problems.push(`valor vacío: ${ns}.${key}`)
    if (placeholders(english) !== placeholders(spanish)) {
      problems.push(`marcadores distintos: ${ns}.${key}\n     en: ${english}\n     es: ${spanish}`)
    }
    if (/[«»“”]/.test(spanish)) problems.push(`comillas tipográficas: ${ns}.${key} = ${spanish}`)
  }
}
for (const [ns, dict] of Object.entries(es)) {
  const reference = en[ns]
  if (!reference) {
    problems.push(`namespace sobrante (no está en el corpus): ${ns}`)
    continue
  }
  for (const key of Object.keys(dict)) {
    if (!(key in reference)) problems.push(`clave sobrante: ${ns}.${key}`)
  }
}

const client = read('lib/client.js')
if (!client.includes(JSON.stringify(es))) {
  problems.push('lib/client.js no contiene los diccionarios de data/es.json — ejecuta `npm run build`')
}
if (!client.includes(`id: ${JSON.stringify(pkg.name)}`)) {
  problems.push(`lib/client.js no usa el id del paquete (${pkg.name}) — ejecuta \`npm run build\``)
}
const patch = read('cordis.patch.yml')
if (!patch.includes(`name: '${pkg.name}'`)) {
  problems.push(`cordis.patch.yml no monta ${pkg.name} — ejecuta \`npm run build\``)
}

const untranslated = strings - copied
console.log(`${pkg.name} v${pkg.version} — idioma ${language.label} (${language.id})`)
console.log(`namespaces: ${Object.keys(es).length} | cadenas: ${strings} | traducidas: ${untranslated} | idénticas al inglés: ${copied}`)
if (problems.length > 0) {
  console.error(`\n${problems.length} problema(s):`)
  for (const problem of problems.slice(0, 50)) console.error(` - ${problem}`)
  process.exit(1)
}
console.log('validación correcta: paridad de claves, marcadores, diccionarios y fila de Loader')

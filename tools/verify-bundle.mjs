#!/usr/bin/env node
/**
 * Self-test of the generated browser half: runs `lib/client.js` exactly the way the
 * harness does — through the `window.__ModuleLoader__.load({ id, factory })` protocol —
 * applies it to a stub client context, and asserts that every namespace and string in
 * data/es.json really reaches the locale registry, together with the language itself.
 *
 * `tools/validate.mjs` checks the data; this checks the artifact the browser receives.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const readJson = (rel) => JSON.parse(readFileSync(join(root, rel), 'utf8'))

const pkg = readJson('package.json')
const language = readJson('data/language.json')
const dictionaries = readJson('data/es.json')
const code = readFileSync(join(root, 'lib', 'client.js'), 'utf8')

const definitions = []
const window = { __ModuleLoader__: { load: (definition) => definitions.push(definition) } }
// The bundle is plain CJS-in-a-factory; executing it must only register the factory.
new Function('window', code)(window)

const problems = []
if (definitions.length !== 1) problems.push(`el bundle registró ${definitions.length} definiciones, se esperaba 1`)
const definition = definitions[0]
if (definition?.id !== pkg.name) problems.push(`id del módulo "${definition?.id}" != nombre del paquete "${pkg.name}"`)

const exported = definition?.factory(() => {
  throw new Error('el bundle no debe requerir ningún módulo')
})
if (typeof exported?.apply !== 'function') problems.push('el bundle no exporta apply')
if (!Array.isArray(exported?.inject) || !exported.inject.includes('locale')) problems.push('el bundle no inyecta el servicio locale')

const registered = new Map()
const languages = []
if (typeof exported?.apply === 'function') {
  exported.apply({
    effect: (fn) => {
      const dispose = fn()
      return typeof dispose === 'function' ? dispose : () => {}
    },
    locale: {
      addLanguage: (value) => {
        languages.push(value)
        return () => {}
      },
      register: (ns, id, dict) => {
        if (registered.has(ns)) problems.push(`namespace registrado dos veces: ${ns}`)
        registered.set(ns, { id, dict })
        return () => {}
      },
    },
  })
}

if (languages.length !== 1 || languages[0].id !== language.id) {
  problems.push(`idioma registrado inesperado: ${JSON.stringify(languages)}`)
} else if (languages[0].label !== language.label || languages[0].fallback !== language.fallback) {
  problems.push(`metadatos del idioma distintos de data/language.json: ${JSON.stringify(languages[0])}`)
}

let strings = 0
for (const [ns, dict] of Object.entries(dictionaries)) {
  const record = registered.get(ns)
  if (!record) {
    problems.push(`namespace no registrado: ${ns}`)
    continue
  }
  if (record.id !== language.id) problems.push(`locale incorrecta en ${ns}: ${record.id}`)
  for (const [key, value] of Object.entries(dict)) {
    strings += 1
    if (record.dict[key] !== value) problems.push(`cadena distinta al materializar: ${ns}.${key}`)
  }
  if (Object.keys(record.dict).length !== Object.keys(dict).length) problems.push(`nº de claves distinto en ${ns}`)
}

console.log(`${pkg.name}: ${definitions.length} definición, ${registered.size} namespaces, ${strings} cadenas, idioma ${JSON.stringify(languages[0])}`)
if (problems.length > 0) {
  console.error(`\n${problems.length} problema(s):`)
  for (const problem of problems.slice(0, 50)) console.error(` - ${problem}`)
  process.exit(1)
}
console.log('bundle correcto: se registra, inyecta locale y materializa todos los diccionarios')

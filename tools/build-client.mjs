#!/usr/bin/env node
/**
 * Generates the two artifacts the harness reads, from the data files:
 *
 *   data/es.json        ->  lib/client.js      (browser half: registers `es` + dictionaries)
 *   data/language.json  ->  cordis.patch.yml   (profile layer: one Loader row)
 *
 * The browser module id and the Loader row name both follow package.json's `name`,
 * so renaming the package is a one-line edit followed by `npm run build`.
 *
 * The emitted browser bundle uses the harness's own module protocol, copied from a
 * shipped bundle (window.__ModuleLoader__.load({ id, factory })): executing it only
 * registers the factory, and every side effect runs when the factory materializes.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => JSON.parse(readFileSync(join(root, rel), 'utf8'))

const pkg = read('package.json')
const language = read('data/language.json')
const dictionaries = read('data/es.json')

const namespaces = Object.keys(dictionaries).length
const strings = Object.values(dictionaries).reduce((n, dict) => n + Object.keys(dict).length, 0)

const banner = `/**
 * ${pkg.name} v${pkg.version} — pack de idioma ${language.label} (${language.id}) para la
 * interfaz web de DeepSeek Harness.
 *
 * Generado automáticamente por tools/build-client.mjs a partir de data/es.json
 * (${namespaces} namespaces, ${strings} cadenas). No editar a mano.
 */`

const client = `${banner}
window.__ModuleLoader__.load({
\tid: ${JSON.stringify(pkg.name)},
\tfactory: (require) => {
\t\tvar module = { exports: {} };
\t\tvar exports = module.exports;
\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
\t\t/** ${language.label} dictionaries, keyed by namespace. */
\t\tconst dictionaries = ${JSON.stringify(dictionaries)};
\t\t/** Required services: the locale registry this pack extends. */
\t\tconst inject = ["locale"];
\t\t/**
\t\t * Register the language and every dictionary through the public locale API.
\t\t * Every key the dictionaries omit keeps falling back to English.
\t\t * @param ctx - client root context.
\t\t */
\t\tfunction apply(ctx) {
\t\t\tctx.effect(() => ctx.locale.addLanguage({
\t\t\t\tid: ${JSON.stringify(language.id)},
\t\t\t\tlabel: ${JSON.stringify(language.label)},
\t\t\t\tfallback: ${JSON.stringify(language.fallback)}
\t\t\t}), "${pkg.name}: language");
\t\t\tctx.effect(() => {
\t\t\t\tconst disposers = [];
\t\t\t\tfor (const [ns, dict] of Object.entries(dictionaries)) disposers.push(ctx.locale.register(ns, ${JSON.stringify(language.id)}, dict));
\t\t\t\treturn () => {
\t\t\t\t\tfor (const dispose of disposers) dispose();
\t\t\t\t};
\t\t\t}, "${pkg.name}: dictionaries");
\t\t}
\t\texports.apply = apply;
\t\texports.inject = inject;
\t\treturn module.exports;
\t}
});
`

const patch = `# ${pkg.name}: one Loader row over the shipped Web composition.
# The browser half registers the ${language.id} language and its dictionaries through
# the public locale registry, so ${language.label} appears in Settings -> General ->
# Language and untranslated keys fall back to ${language.fallback}.

- insert:
    - id: locale-${language.id}
      name: '${pkg.name}'
`

mkdirSync(join(root, 'lib'), { recursive: true })
writeFileSync(join(root, 'lib', 'client.js'), client, 'utf8')
writeFileSync(join(root, 'cordis.patch.yml'), patch, 'utf8')

console.log(`lib/client.js   ${(client.length / 1024).toFixed(1)} KB  (id: ${pkg.name})`)
console.log(`cordis.patch.yml  row id: locale-${language.id}, name: ${pkg.name}`)
console.log(`${namespaces} namespaces, ${strings} cadenas`)

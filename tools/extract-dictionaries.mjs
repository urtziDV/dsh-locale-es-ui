#!/usr/bin/env node
/**
 * Extrae el corpus inglés de localización desde una instalación de DSH y reescribe
 * `data/en.json`, el corpus de referencia contra el que `tools/validate.mjs` comprueba la
 * paridad. Úsalo cuando salga una versión nueva de DSH con claves nuevas o renombradas.
 *
 *   node tools/extract-dictionaries.mjs "C:\...\DeepSeek Harness\resources\app.asar"
 *   node tools/extract-dictionaries.mjs <app.asar> <salida.json>
 *
 * Lee el propio `app.asar` (formato asar: cabecera pickle + JSON + contenidos) y analiza
 * los bundles de cliente que DSH sirve al navegador, donde cada paquete registra sus
 * diccionarios con `ctx.locale.register(ns, { zh, en })`. Solo se queda con el diccionario
 * inglés de cada namespace; el chino se descarta.
 */
import fs from 'node:fs';
import path from 'node:path';

// Electron instrumenta cualquier ruta que contenga ".asar"; aquí dirigimos el archivo a mano.
process.noAsar = true;

const [asarPath, outPath = path.join(process.cwd(), 'data', 'en.json')] = process.argv.slice(2);
if (asarPath === undefined) {
  console.error('uso: node tools/extract-dictionaries.mjs <ruta app.asar> [salida.json]');
  process.exit(1);
}

/** Cabecera del archivo asar y comienzo de la zona de contenidos. */
function openAsar(file) {
  const fd = fs.openSync(file, 'r');
  const head = Buffer.alloc(8);
  if (fs.readSync(fd, head, 0, 8, 0) !== 8) throw new Error('no se pudo leer la cabecera del asar');
  const headerPickleSize = head.readUInt32LE(4);
  const headerBuf = Buffer.alloc(headerPickleSize);
  if (fs.readSync(fd, headerBuf, 0, headerPickleSize, 8) !== headerPickleSize) throw new Error('cabecera incompleta');
  const jsonLength = headerBuf.readUInt32LE(4);
  const header = JSON.parse(headerBuf.subarray(8, 8 + jsonLength).toString('utf8'));
  return { fd, header, contentStart: 8 + headerPickleSize };
}

function walk(node, prefix, out) {
  for (const [name, child] of Object.entries(node.files ?? {})) {
    const rel = prefix ? `${prefix}/${name}` : name;
    if (child.files) walk(child, rel, out);
    else out.push({ rel, node: child });
  }
}

function readEntry(asar, entry) {
  if (entry.node.unpacked === true || entry.node.link !== undefined) return null;
  const size = Number(entry.node.size);
  const buffer = Buffer.alloc(size);
  fs.readSync(asar.fd, buffer, 0, size, asar.contentStart + Number(entry.node.offset));
  return buffer.toString('utf8');
}

const skipString = (src, i) => {
  const quote = src[i];
  i++;
  while (i < src.length) {
    if (src[i] === '\\') { i += 2; continue; }
    if (src[i] === quote) return i;
    i++;
  }
  return i;
};

/** Devuelve el literal de objeto que empieza en `braceIdx`, o null. */
function objectLiteralAt(src, braceIdx) {
  let depth = 0;
  for (let i = braceIdx; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') { i = skipString(src, i); continue; }
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i < 0) return null; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 1; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(braceIdx, i + 1); }
  }
  return null;
}

/** Argumentos de la llamada cuyo paréntesis de apertura está en `openIdx`. */
function parenArgs(src, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') { i = skipString(src, i); continue; }
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') { depth--; if (depth === 0) return src.slice(openIdx + 1, i); }
  }
  return null;
}

function splitTop(text) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' || c === "'" || c === '`') { i = skipString(text, i); continue; }
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (c === ',' && depth === 0) { parts.push(text.slice(start, i)); start = i + 1; }
  }
  parts.push(text.slice(start));
  return parts.map((part) => part.trim()).filter((part) => part.length > 0);
}

function unquote(literal) {
  try { return JSON.parse(literal); } catch { /* sigue */ }
  try { return new Function(`return (${literal})`)(); } catch { return undefined; }
}

function evalLiteral(literal) {
  try {
    const value = new Function(`return (${literal})`)();
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
    const out = {};
    let ok = false;
    for (const [key, entry] of Object.entries(value)) if (typeof entry === 'string') { out[key] = entry; ok = true; }
    return ok ? out : null;
  } catch { return null; }
}

/** Respaldo para literales que no se pueden evaluar: pares "clave": "valor". */
function regexParse(literal) {
  const out = {};
  for (const match of literal.matchAll(/"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) {
    try { out[JSON.parse(`"${match[1]}"`)] = JSON.parse(`"${match[2]}"`); } catch { /* ignora */ }
  }
  return Object.keys(out).length > 0 ? out : null;
}

const corpus = new Map();
let scanned = 0;

for (const entry of (() => { const out = []; const asar = openAsar(asarPath); walk(asar.header, '', out); return out.map((e) => ({ ...e, asar })); })()) {
  if (!/^dsh\/node_modules\/@deepseek-ai\/[^/]+\/lib\/client(\.[\w.-]+)?\.js$/.test(entry.rel)) continue;
  const src = readEntry(entry.asar, entry);
  if (src === null) continue;
  scanned++;

  const objConsts = new Map();
  for (const match of src.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\{/g)) {
    const literal = objectLiteralAt(src, match.index + match[0].length - 1);
    if (literal) objConsts.set(match[1], literal);
  }
  const strConsts = new Map();
  for (const match of src.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g)) {
    const value = unquote(match[2]);
    if (typeof value === 'string') strConsts.set(match[1], value);
  }
  const cache = new Map();
  const resolveDict = (ident) => {
    if (cache.has(ident)) return cache.get(ident);
    const literal = objConsts.get(ident);
    const dict = literal ? (evalLiteral(literal) ?? regexParse(literal)) : null;
    cache.set(ident, dict);
    return dict;
  };
  const add = (ns, dict) => {
    if (!ns || !dict) return;
    const target = corpus.get(ns) ?? new Map();
    for (const [key, value] of Object.entries(dict)) target.set(key, value);
    corpus.set(ns, target);
  };

  for (const match of src.matchAll(/(?:\.|\b)locale\s*\.\s*register\s*\(/g)) {
    const args = parenArgs(src, match.index + match[0].length - 1);
    if (args === null) continue;
    const parts = splitTop(args);
    if (parts.length < 2) continue;
    let ns = unquote(parts[0]);
    if (ns === undefined) ns = strConsts.get(parts[0]);
    if (typeof ns !== 'string' || !/^[A-Za-z0-9_.-]+$/.test(ns)) continue;

    const rest = parts.slice(1);
    if (rest[0].startsWith('{')) {
      for (const pair of splitTop(rest[0].slice(1, -1))) {
        const colon = pair.indexOf(':');
        if (colon < 0) {
          const ident = pair.trim();
          if (/^en(\$|$)/i.test(ident)) add(ns, resolveDict(ident));
          continue;
        }
        const keyExpr = pair.slice(0, colon).trim();
        let key = unquote(keyExpr);
        if (typeof key !== 'string' && /^[A-Za-z_$][\w$]*$/.test(keyExpr)) key = keyExpr;
        if (key !== 'en') continue;
        const valueExpr = pair.slice(colon + 1).trim();
        if (valueExpr.startsWith('{')) {
          const literal = objectLiteralAt(valueExpr, 0);
          add(ns, literal ? (evalLiteral(literal) ?? regexParse(literal)) : null);
        } else {
          add(ns, resolveDict(valueExpr));
        }
      }
    } else if (unquote(rest[0]) === 'en' && rest[1] !== undefined) {
      if (rest[1].startsWith('{')) {
        const literal = objectLiteralAt(rest[1], 0);
        add(ns, literal ? (evalLiteral(literal) ?? regexParse(literal)) : null);
      } else {
        add(ns, resolveDict(rest[1]));
      }
    }
  }
}

const output = {};
let keys = 0;
for (const [ns, dict] of [...corpus.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  output[ns] = Object.fromEntries([...dict.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  keys += dict.size;
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`bundles analizados: ${scanned}`);
console.log(`namespaces: ${Object.keys(output).length} · claves: ${keys}`);
console.log(`escrito: ${outPath}`);
console.log('siguiente: copia a data/es.json las claves nuevas y ejecuta `npm test`');

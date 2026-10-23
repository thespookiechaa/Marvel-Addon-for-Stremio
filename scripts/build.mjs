import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const SOURCES = [
  { key: 'chronological', file: 'chronologicalData.js', label: 'MCU • Chronologie' },
  { key: 'release', file: 'releaseData.js', label: 'MCU • Ordre de sortie' },
  { key: 'xmen', file: 'xmenData.js', label: 'X-Men • Chronologie' },
  { key: 'movies', file: 'moviesData.js', label: 'Marvel • Tous les films' },
  { key: 'series', file: 'seriesData.js', label: 'Marvel • Toutes les séries' },
  { key: 'animations', file: 'animationsData.js', label: 'Marvel • Animations' }
];

export const PAGE_SIZE = 100;
const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(projectDir, 'dist');
const sourceBase = process.env.UPSTREAM_BASE ?? 'https://raw.githubusercontent.com/joaogonp/addon-marvel/main/Data/';

export function decodeUpstreamModule(src) {
  const match = src.trim().match(/^export\s+default\s+(\[[\s\S]*\])\s*;?\s*$/);
  if (!match) throw new Error('Format de la liste source inattendu : export default JSON array requis.');
  const data = JSON.parse(match[1]);
  if (!Array.isArray(data)) throw new Error('Liste source invalide.');
  return data;
}
export function validPoster(src) {
  if (typeof src !== 'string') return undefined;
  try {
    const url = new URL(src);
    return ['https:', 'http:'].includes(url.protocol) ? src : undefined;
  } catch { return undefined; }
}
export function toMeta(item, cache = {}) {
  if (!item || !['movie', 'series'].includes(item.type)) return null;
  const id = item.imdbId || item.id;
  if (typeof id !== 'string' || !/^tt\d{5,12}$/.test(id) || !item.title) return null;
  const fromCache = cache[id] ?? {};
  const meta = { id, type: item.type, name: String(item.title).trim() };
  const poster = validPoster(item.poster) || validPoster(fromCache.poster);
  if (poster) meta.poster = poster;
  const releaseInfo = item.releaseYear || fromCache.releaseInfo;
  if (releaseInfo && /^\d{4}$/.test(String(releaseInfo))) meta.releaseInfo = String(releaseInfo);
  if (fromCache.description && fromCache.description !== 'No description available.') {
    meta.description = String(fromCache.description);
  }
  return meta;
}
export function normalize(items, cache = {}) {
  const seen = new Set();
  return items.map(x => toMeta(x, cache)).filter(x => {
    if (!x || seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });
}
async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { 'user-agent': 'marvel-addon-build/1.0' } });
  if (!res.ok) throw new Error(`Source inaccessible : ${res.status} ${url}`);
  return res.text();
}
export async function loadCatalogs({ fixture = false } = {}) {
  if (fixture) {
    const data = JSON.parse(await readFile(path.join(projectDir, 'fixtures/catalogs.json'), 'utf8'));
    return { data, cache: {}, demo: true };
  }
  const [cacheText, ...texts] = await Promise.all([
    getJson(`${sourceBase}metadataCache.json`),
    ...SOURCES.map(s => getJson(`${sourceBase}${s.file}`))
  ]);
  const cache = JSON.parse(cacheText);
  const data = Object.fromEntries(SOURCES.map((s, i) => [s.key, decodeUpstreamModule(texts[i])]));
  if (SOURCES.some(s => !data[s.key].length)) throw new Error('Un catalogue en amont est vide : compilation interrompue.');
  return { data, cache, demo: false };
}
const writeJson = async (file, value) => {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value), 'utf8');
};
export function selectCatalogs(normalized, mask) {
  return SOURCES.filter((_, i) => mask & (1 << i)).flatMap(s => {
    return ['movie', 'series'].flatMap(type => {
      const metas = normalized[s.key].filter(x => x.type === type);
      if (!metas.length) return [];
      return [{ type, id: `marvel-${s.key}-${type}`, name: `${s.label} • ${type === 'movie' ? 'Films' : 'Séries'}`, metas }];
    });
  });
}
export function manifestFor(catalogs, mask) {
  return {
    id: `com.marvel.catalogs.stremio.${mask}`,
    version: '1.0.0',
    name: 'Marvel Addon for Stremio',
    description: 'Des catalogues Marvel personnalisables : MCU, X-Men, films, séries et animations. Sans flux vidéo.',
    resources: ['catalog'],
    types: ['movie', 'series'],
    catalogs: catalogs.map(({type, id, name}) => ({ type, id, name, extra: [{name: 'skip', isRequired: false}] })),
    behaviorHints: { configurable: true, configurationRequired: false }
  };
}
async function buildVariant(where, catalogs, mask) {
  const prefix = mask === 63 && where === outDir ? '../' : '../../../';
  const redirect = `<!doctype html><html lang="fr"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${prefix}"><title>Configurer Marvel Addon for Stremio</title><p>Configuration sur <a href="${prefix}">Marvel Addon for Stremio</a>.</p></html>`;
  await mkdir(path.join(where, 'configure'), {recursive:true});
  await writeFile(path.join(where, 'configure', 'index.html'), redirect, 'utf8');
  await writeJson(path.join(where, 'manifest.json'), manifestFor(catalogs, mask));
  for (const { type, id, metas } of catalogs) {
    const parent = path.join(where, 'catalog', type);
    await writeJson(path.join(parent, `${id}.json`), { metas: metas.slice(0, PAGE_SIZE) });
    for (let skip = 0; skip <= Math.ceil(metas.length / PAGE_SIZE) * PAGE_SIZE; skip += PAGE_SIZE) {
      await writeJson(path.join(parent, id, `skip=${skip}.json`), { metas: metas.slice(skip, skip + PAGE_SIZE) });
    }
  }
}
export async function build({ fixture = false } = {}) {
  const { data, cache, demo } = await loadCatalogs({ fixture });
  const normalized = Object.fromEntries(SOURCES.map(s => [s.key, normalize(data[s.key] ?? [], cache)]));
  if (SOURCES.some(s => !normalized[s.key].length)) throw new Error('Catalogue sans identifiants IMDb valides.');
  await rm(outDir, {recursive: true, force: true});
  await mkdir(outDir, {recursive: true});
  await cp(path.join(projectDir, 'site'), outDir, { recursive: true });
  await buildVariant(outDir, selectCatalogs(normalized, 63), 63);
  for (let mask = 1; mask <= 63; mask++) {
    await buildVariant(path.join(outDir, 'p', String(mask)), selectCatalogs(normalized, mask), mask);
  }
  await writeJson(path.join(outDir, 'timeline.json'), normalized.chronological);
  await writeJson(path.join(outDir, 'stats.json'), {
    demo,
    sources: SOURCES.map(s => ({ key: s.key, label: s.label, count: normalized[s.key].length })),
    generatedAt: new Date().toISOString()
  });
  await writeFile(path.join(outDir, '.nojekyll'), '', 'utf8');
  console.log(`Construction terminée : ${demo ? 'DÉMO locale' : 'catalogues complets'}, 63 configurations, ${SOURCES.length} collections.`);
  return {outDir, normalized, demo};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  build({fixture: process.argv.includes('--fixture')}).catch(err => {
    console.error(`Erreur de build : ${err.message}`);
    process.exitCode = 1;
  });
}

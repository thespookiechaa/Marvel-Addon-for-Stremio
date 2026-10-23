import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build, decodeUpstreamModule, toMeta, normalize} from './build.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = async p => JSON.parse(await readFile(path.join(root,'dist',p),'utf8'));
test('parses upstream catalogs without executing JavaScript',()=>{
  assert.deepEqual(decodeUpstreamModule('export default [{"title":"A"}];'),[{title:'A'}]);
  assert.throws(()=>decodeUpstreamModule('export default [process.exit(1)]'), SyntaxError);
  assert.throws(()=>decodeUpstreamModule('console.log("evil"); export default []'));
});
test('validates IMDb IDs, safe posters, and deduplication',()=>{
  assert.equal(toMeta({title:'Invalid',type:'movie',imdbId:'marvel_tt01'}),null);
  assert.deepEqual(toMeta({title:'Test',type:'movie',imdbId:'tt1234567', poster:'javascript:alert(1)',releaseYear:'2026'}), {id:'tt1234567',type:'movie',name:'Test',releaseInfo:'2026'});
  assert.equal(normalize([{title:'Test',type:'movie',imdbId:'tt1234567'},{title:'Test',type:'movie',imdbId:'tt1234567'}]).length,1);
});
test('generates manifests and catalogs using demo data',async()=>{
  await build({fixture:true});
  const manifest=await read('manifest.json');
  assert.equal(manifest.id,'com.marvel.catalogs.stremio.63');
  assert.deepEqual(manifest.resources,['catalog']);
  assert.deepEqual(manifest.types,['movie','series']);
  assert.ok(manifest.catalogs.every(c=>['movie','series'].includes(c.type)));
  assert.equal((await read('p/1/manifest.json')).catalogs.length,2);
  assert.equal((await read('p/4/manifest.json')).catalogs.length,1);
  assert.equal((await read('p/63/manifest.json')).catalogs.length,manifest.catalogs.length);
  const films=await read('catalog/movie/marvel-chronological-movie.json');
  const series=await read('catalog/series/marvel-chronological-series.json');
  assert.equal(films.metas[0].id,'tt0458339');
  assert.equal(films.metas[0].type,'movie');
  assert.equal(series.metas[0].id,'tt3475734');
  assert.equal((await read('catalog/movie/marvel-chronological-movie/skip=0.json')).metas.length,3);
  assert.equal((await read('catalog/movie/marvel-chronological-movie/skip=100.json')).metas.length,0);
  assert.equal((await read('timeline.json')).length,4);
  assert.equal((await read('stats.json')).demo,true);
  for(let mask=1;mask<=63;mask++)assert.ok((await stat(path.join(root, 'dist', 'p', String(mask), 'manifest.json'))).isFile());
});

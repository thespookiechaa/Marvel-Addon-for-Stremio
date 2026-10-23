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
  assert.deepEqual(manifest.stremioAddonsConfig, {
    issuer: 'https://stremio-addons.net',
    signature: 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0..5pis_cbSsd0D1iMxK4ya2Q.ZJlNofggFLlXtV0Owl3wVK-v0Fu3Z8RXhNufpGX4s1PHTCdj_-a6ftGCirc1s189Jrzs7rvLmZQJZw5D8-x538YlubHLwGenFiZSvc_4uPLlb6mRA9gTcQ9Oytra1s9v.X-YAeK2di_Ei8sLwOGPA_A'
  });
  assert.ok(manifest.catalogs.every(c=>['movie','series'].includes(c.type)));
  assert.equal((await read('p/1/manifest.json')).catalogs.length,2);
  assert.equal((await read('p/4/manifest.json')).catalogs.length,1);
  assert.equal((await read('p/63/manifest.json')).catalogs.length,manifest.catalogs.length);
  const roadOnly=(await read('p/64/manifest.json'));
  assert.deepEqual(roadOnly.catalogs.map(c=>c.type),['movie','series']);
  assert.ok(roadOnly.catalogs.every(c=>c.name.startsWith('Road to Doomsday')));
  const everything=(await read('p/127/manifest.json'));
  assert.equal(everything.catalogs.length,manifest.catalogs.length+2);
  assert.equal(everything.version,'1.2.0');
  assert.equal(everything.stremioAddonsConfig.signature,manifest.stremioAddonsConfig.signature);
  const films=await read('catalog/movie/marvel-chronological-movie.json');
  const series=await read('catalog/series/marvel-chronological-series.json');
  assert.equal(films.metas[0].id,'tt0458339');
  assert.equal(films.metas[0].type,'movie');
  assert.equal(series.metas[0].id,'tt3475734');
  assert.equal((await read('catalog/movie/marvel-chronological-movie/skip=0.json')).metas.length,3);
  assert.equal((await read('catalog/movie/marvel-chronological-movie/skip=100.json')).metas.length,0);
  assert.equal((await read('timeline.json')).length,4);
  const road=await read('road.json');
  assert.equal(road.items.length,16);
  assert.equal(road.items[0].id,'tt0120903');
  assert.equal(road.items[1].id,'tt0290334');
  assert.equal(road.items[6].id,'tt9140560');
  assert.equal(road.items[6].name,'WandaVision');
  assert.equal(road.items[6].type,'series');
  assert.equal(road.items[7].id,'tt9140554');
  assert.equal(road.items[7].watchNote,'Watch seasons 1 and 2');
  assert.equal(road.items.at(-1).id,'tt10676052');
  assert.equal(road.items.filter(item=>item.type==='series').length,2);
  assert.deepEqual(road.releases,{fr:'2026-12-16',us:'2026-12-18'});
  assert.equal((await read('p/64/catalog/movie/marvel-road-movie.json')).metas.length,14);
  const roadSeries = await read('p/64/catalog/series/marvel-road-series.json');
  assert.equal(roadSeries.metas.length,2);
  assert.deepEqual(roadSeries.metas.map(({id})=>id),['tt9140560','tt9140554']);
  assert.equal(roadSeries.metas[0].name,'WandaVision');
  assert.equal(roadSeries.metas[1].description,'Watch seasons 1 and 2');
  assert.equal((await read('stats.json')).sources.find(source=>source.key==='road').count,16);
  const builtHtml=await readFile(path.join(root,'dist','index.html'),'utf8');
  const doomCss=await readFile(path.join(root,'dist','road-doom.css'),'utf8');
  assert.match(builtHtml, /road-doom\.css\?v=1\.2\.0/);
  assert.match(builtHtml, /16 titles/);
  assert.match(builtHtml, /0 \/ 16 watched/);
  assert.match(builtHtml, /class="road-feature doom-theme"/);
  assert.match(builtHtml, /class="toggle road-toggle"/);
  assert.match(doomCss, /--doom-green:\s*#6fd39a/);
  assert.match(doomCss, /prefers-reduced-motion:\s*reduce/);
  assert.match(doomCss, /\.road-feature\.doom-theme/);
  assert.equal((await read('stats.json')).demo,true);
  for(let mask=1;mask<=127;mask++){
    assert.ok((await stat(path.join(root, 'dist', 'p', String(mask), 'manifest.json'))).isFile());
    assert.deepEqual((await read(`p/${mask}/manifest.json`)).stremioAddonsConfig, manifest.stremioAddonsConfig);
  }
});

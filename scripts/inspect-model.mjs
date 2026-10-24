import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(process.argv[2]);
const root = doc.getRoot();
for (const n of root.listNodes()) {
  const m = n.getMesh(); if (!m) { console.log('node', n.getName()); continue; }
  const b = getBounds(n);
  let tris = 0; const mats = new Set(); const attrs=new Set();
  for (const p of m.listPrimitives()) { tris += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount())/3; mats.add(p.getMaterial()?.getName()); p.listSemantics().forEach(s=>attrs.add(s)); }
  console.log(n.getName(), 'tris', tris, 'mats', [...mats], [...attrs].join(','), 'min', b.min.map(v=>v.toFixed(3)), 'max', b.max.map(v=>v.toFixed(3)));
}
for (const m of root.listMaterials()) console.log('MAT', m.getName(), m.getBaseColorFactor(), 'rough', m.getRoughnessFactor(), 'metal', m.getMetallicFactor(), 'tex', !!m.getBaseColorTexture());
console.log('textures', root.listTextures().map(t=>t.getName()+':'+t.getMimeType()+':'+t.getImage()?.byteLength));

import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const require=createRequire(new URL('../.video-tools/model-optimizer/package.json',import.meta.url));
const {NodeIO}=require('@gltf-transform/core');
const {ALL_EXTENSIONS}=require('@gltf-transform/extensions');
const {draco,meshopt}=require('@gltf-transform/functions');
const draco3d=require('draco3dgltf');
const {MeshoptEncoder,MeshoptDecoder}=await import(new URL('../.video-tools/model-optimizer/node_modules/meshoptimizer/index.js',import.meta.url));
await MeshoptEncoder.ready;await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
 'draco3d.encoder':await draco3d.createEncoderModule(),
 'draco3d.decoder':await draco3d.createDecoderModule(),
 'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder,
});
const directory='artifacts/lotus-model-optimization';
await mkdir(directory,{recursive:true});
const report=[];
for(const name of ['emira','eletre','emeya']){
 const source=`projects/lotus/assets/models/${name}.glb`;
 const bytes=await readFile(source);
 const original=await io.read(source);
 const signature=document=>({
  nodes:document.getRoot().listNodes().map(n=>n.getName()),
  meshes:document.getRoot().listMeshes().map(m=>m.getName()),
  materials:document.getRoot().listMaterials().map(m=>m.getName()),
  textures:document.getRoot().listTextures().map(t=>createHash('sha256').update(t.getImage()).digest('hex')).sort(),
 });
 const originalSignature=signature(original);
 for(const mode of ['draco','meshopt']){
  const document=await io.read(source);
  // Keep topology, material assignments and textures; only encode the geometry.
  await document.transform(mode==='draco'?
   draco({encodeSpeed:5,decodeSpeed:8,quantizePosition:16,quantizeNormal:12,quantizeTexcoord:14,quantizeColor:12}):
   meshopt({encoder:MeshoptEncoder,level:'medium',quantizePosition:16,quantizeNormal:12,quantizeTexcoord:14,quantizeColor:12,cleanup:false}));
  const output=`${directory}/${name}-${mode}.glb`;
  await io.write(output,document);
  const decoded=await io.read(output);
  const same=JSON.stringify(signature(decoded))===JSON.stringify(originalSignature);
  if(!same)throw Error(`Model structure or texture changed: ${output}`);
  const optimized=await readFile(output);
  const result={name,mode,originalBytes:bytes.length,bytes:optimized.length,savedPercent:+((1-optimized.length/bytes.length)*100).toFixed(1),originalSha256:createHash('sha256').update(bytes).digest('hex'),structureAndTexturesPreserved:same};
  report.push(result);console.log(JSON.stringify(result));
 }
}
await writeFile(`${directory}/sizes.json`,JSON.stringify(report,null,2)+'\n');

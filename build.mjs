import {cp,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {deployOptimizedImages} from './lib/deploy-optimized-images.mjs';
const root=fileURLToPath(new URL('./',import.meta.url));
const output=path.join(root,'dist');
const includeCurlTest=process.argv.includes('--with-curl-test');
// Source originals stay in projects/. These exact files have runtime replacements.
const excluded=new Set([
 'projects/README.md',
 'projects/lotus/assets/models/emira.glb',
 'projects/lotus/assets/models/eletre.glb',
 'projects/lotus/assets/models/emeya.glb',
 'projects/men-i-trust/assets/videos/break-for-lovers-live-2025.mp4',
 ...includeCurlTest?[]:['curl-test.html','curl-test.js'],
]);
const options={bundle:true,minify:true,jsx:'automatic',target:['es2020'],define:{'process.env.NODE_ENV':'"production"'}};
await build({...options,entryPoints:['src/main.jsx'],outfile:'dist/app.js',loader:{'.ts':'ts'}});
if(includeCurlTest){
 await build({...options,entryPoints:['src/ProjectCurlTest.jsx'],outfile:'dist/curl-test.js'});
 await cp(new URL('./artifacts/curl-test.html',import.meta.url),new URL('./dist/curl-test.html',import.meta.url));
}
await cp(new URL('./projects/',import.meta.url),new URL('./dist/projects/',import.meta.url),{
 recursive:true,
 filter:(_source,destination)=>!excluded.has(path.relative(output,destination).split(path.sep).join('/')),
});
// Also remove excluded files left over from older builds, without deleting source files.
for(const relative of excluded){
 const target=path.resolve(output,relative);
 if(!target.startsWith(output+path.sep))throw Error('Invalid deployment exclusion');
 await rm(target,{force:true});
}
await deployOptimizedImages(root,output);
console.log('Portfolio build complete');

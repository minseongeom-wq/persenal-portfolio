import {cp} from 'node:fs/promises';
import {build} from 'esbuild';
const options={bundle:true,minify:true,jsx:'automatic',target:['es2020'],define:{'process.env.NODE_ENV':'"production"'}};
await build({...options,entryPoints:['src/main.jsx'],outfile:'dist/app.js',loader:{'.ts':'ts'}});
await build({...options,entryPoints:['src/ProjectCurlTest.jsx'],outfile:'dist/curl-test.js'});
await cp(new URL('./projects/',import.meta.url),new URL('./dist/projects/',import.meta.url),{recursive:true});
console.log('Portfolio build complete');

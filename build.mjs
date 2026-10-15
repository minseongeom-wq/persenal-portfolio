import {build} from 'esbuild';
const options={bundle:true,minify:true,jsx:'automatic',target:['es2020'],define:{'process.env.NODE_ENV':'"production"'}};
await build({...options,entryPoints:['src/main.jsx'],outfile:'dist/app.js',loader:{'.ts':'ts'}});
await build({...options,entryPoints:['src/ProjectCurlTest.jsx'],outfile:'dist/curl-test.js'});
console.log('Portfolio build complete');

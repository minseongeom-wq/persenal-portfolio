import {build} from 'esbuild';
await build({entryPoints:['src/main.jsx'],bundle:true,outfile:'dist/app.js',minify:true,loader:{'.ts':'ts'},jsx:'automatic'});
await build({entryPoints:['src/ProjectCurlTest.jsx'],bundle:true,outfile:'dist/curl-test.js',minify:true,jsx:'automatic'});
console.log('Portfolio build complete');

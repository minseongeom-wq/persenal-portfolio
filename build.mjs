import {build} from 'esbuild';
await build({entryPoints:['src/main.jsx'],bundle:true,outfile:'dist/app.js',minify:true,loader:{'.ts':'ts'},jsx:'automatic'});
console.log('Portfolio build complete');

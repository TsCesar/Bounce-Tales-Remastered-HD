'use strict';
/* Produce a fully LOCAL asset bundle for Capacitor on Android and iOS.
 * Run after npm install; generated HD texture and scenery pages are added
 * by CI before npx cap sync. No remote site URL or network is required.
 */
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const output=path.join(root,'public');
const files=[
  'index.html','game.js','style.css','sw.js','manifest.webmanifest',
  'favicon.png','icon-192.png','icon-512.png','apple-touch-icon.png',
  'bounce-tales-web-preview.png',
];
const dirs=['src','assets','remaster'];
fs.mkdirSync(output,{recursive:true});
for(const item of files){
  const input=path.join(root,item);
  if(!fs.existsSync(input))throw Error('Missing game resource: '+item);
  fs.copyFileSync(input,path.join(output,item));
}
for(const dir of dirs){
  const input=path.join(root,dir);
  if(!fs.existsSync(input))throw Error('Missing game directory: '+dir);
  fs.cpSync(input,path.join(output,dir),{recursive:true,force:true});
}
const html=fs.readFileSync(path.join(output,'index.html'),'utf8');
for(const resource of [
 'src/rlef-reader.js','assets/original/bf',
 'remaster/book.js','remaster/remaster.js','src/rock-break.js'
]){
  const file=path.join(output,resource);
  if(!fs.existsSync(file))throw Error('Native bundle missing: '+resource);
}
if(!html.includes('window.Capacitor?.isNativePlatform?.()'))throw Error(
  'Native bundle requires service-worker registration disabled in Capacitor'
);
fs.writeFileSync(path.join(output,'mobile-bundle.json'),JSON.stringify({
  platform:'capacitor',offline:true,assetBase:'relative',
  originalGameFiles:true,generatedAssets:['remaster/assets/hd','remaster/assets/scenery']
},null,2));
console.log('Prepared offline game bundle:',output);

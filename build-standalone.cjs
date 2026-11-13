const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const inlineAssets = source => source.replace(/assets\/[a-z0-9-]+\.png/g, asset =>
  'data:image/png;base64,' + fs.readFileSync(path.join(root, 'dist', asset)).toString('base64'));
const css = inlineAssets(fs.readFileSync(path.join(root, 'dist/style.css'), 'utf8'));
const js = inlineAssets(fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8'));
const coating = fs.readFileSync(path.join(root, 'dist/coating.js'), 'utf8');
let html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
html = html.replace('<link rel="stylesheet" href="style.css">', () => `<style>${css}</style>`)
  .replace('<script src="coating.js"></script>', () => `<script>${coating.replace(/<\/script/gi, '<\\/script')}</script>`)
  .replace('<script src="app.js"></script>', () => `<script>${js.replace(/<\/script/gi, '<\\/script')}</script>`);
fs.mkdirSync(path.join(root, 'outputs'), {recursive:true});
const output = path.join(root, 'outputs', '아무거나-빼빼로.html');
fs.writeFileSync(output, html, 'utf8');
console.log(output);

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
// Expose only the generated website, never arbitrary local files.
const htmlFile = path.join(__dirname,'outputs','아무거나-빼빼로.html');
http.createServer((request,response)=>{
  if(request.url!=='/' && request.url!=='/index.html') {
    response.writeHead(404);response.end('Not found');return;
  }
  response.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
  response.end(fs.readFileSync(htmlFile));
}).listen(4173,'127.0.0.1',()=>console.log('http://127.0.0.1:4173'));

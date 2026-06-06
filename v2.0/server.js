const http = require('http');
const fs = require('fs');
const path = require('path');

const staticDir = path.join('g:', 'Desktop', '彩票模拟', 'Lottery-Simulator', 'v2.0');

const server = http.createServer((req, res) => {
  console.log('Request:', req.url);

  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(staticDir, filePath);

  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.log('Error reading file:', filePath, err);
      res.writeHead(404);
      res.end('Not found: ' + filePath);
      return;
    }
    console.log('Serving:', filePath, contentType);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(3001, () => {
  console.log('Server running at http://localhost:3001/');
});
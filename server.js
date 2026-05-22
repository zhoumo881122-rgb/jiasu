const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 4174);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    const cleanPath = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = path.normalize(path.join(root, cleanPath));

    const relativePath = path.relative(root, filePath);
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      res.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
      res.end(data);
    });
  })
  .listen(port, () => {
    console.log(`LanHai release page preview: http://127.0.0.1:${port}`);
  });

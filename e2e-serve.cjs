/**
 * 简单静态服务器,serving dist/ on a configurable port + base path.
 * 模拟 GitHub Pages 部署:访问 http://localhost:PORT/HTML/ -> dist/index.html
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 4174);
const DIST = path.join(__dirname, "dist");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

function serve(req, res) {
  let url = decodeURIComponent(req.url.split("?")[0]);
  // 1) root -> /HTML/ redirect
  if (url === "/" || url === "") {
    res.writeHead(302, { Location: "/HTML/" });
    return res.end();
  }
  // 2) /pptxgen.bundle.js, /pdf-lib.bundle.js 走 dist 根(public 资源在 GitHub Pages 是根级)
  if (url === "/pptxgen.bundle.js" || url === "/pdf-lib.bundle.js") {
    const fp = path.join(DIST, url.slice(1));
    if (!fp.startsWith(DIST)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
    return fs.stat(fp, (err, st) => {
      if (err || !st.isFile()) {
        res.writeHead(404);
        return res.end("Not found");
      }
      res.writeHead(200, {
        "Content-Type": MIME[".js"] || "application/javascript",
        "Content-Length": st.size,
        "Cache-Control": "no-cache",
      });
      fs.createReadStream(fp).pipe(res);
    });
  }
  // 3) only serve /HTML/* path
  if (!url.startsWith("/HTML/") && url !== "/HTML") {
    res.writeHead(404);
    return res.end("Not Found");
  }
  let rel = url.slice("/HTML/".length);
  if (rel === "" || rel.endsWith("/")) rel = (rel || "") + "index.html";
  const filePath = path.join(DIST, rel);
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end(`Not found: ${rel}`);
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-cache",
      "Content-Length": st.size,
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

http.createServer(serve).listen(PORT, () => {
  console.log(`[e2e-serve] dist served at http://localhost:${PORT}/HTML/`);
});
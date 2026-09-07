import http from "http";
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(__dirname, "../cloud-functions/api/[[default]].js");
const mod = await import(pathToFileURL(entry).href);

const port = Number(process.env.PORT || 8787);
http
  .createServer(async (req, res) => {
    try {
      const host = req.headers.host || `127.0.0.1:${port}`;
      const request = new Request(`http://${host}${req.url}`, {
        method: req.method,
        headers: req.headers,
        body: ["GET", "HEAD"].includes(req.method || "GET") ? undefined : req,
        duplex: "half",
      });
      const response = await mod.onRequest({ request });
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      const buf = Buffer.from(await response.arrayBuffer());
      res.end(buf);
    } catch (e) {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: e.message || String(e) }));
    }
  })
  .listen(port, () => {
    console.log(`handler-mode dev server http://127.0.0.1:${port}`);
    console.log("GET  /api/eleme/health");
    console.log("POST /api/eleme/fp");
  });

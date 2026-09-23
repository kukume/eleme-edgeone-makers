import { build } from "esbuild";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const targets = [
  { entry: "src/entries/health.js", out: "cloud-functions/api/eleme/health.js" },
  { entry: "src/entries/fp.js", out: "cloud-functions/api/eleme/fp.js" },
  { entry: "src/entries/sms-send.js", out: "cloud-functions/api/eleme/sms/send.js" },
  { entry: "src/entries/sms-login.js", out: "cloud-functions/api/eleme/sms/login.js" },
];

for (const t of targets) {
  const outfile = path.join(root, t.out);
  fs.mkdirSync(path.dirname(outfile), { recursive: true });
  await build({
    entryPoints: [path.join(root, t.entry)],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    external: ["jsdom", "https", "http", "zlib", "crypto"],
  });
  const text = fs.readFileSync(outfile, "utf8");
  if (!text.includes("onRequest")) {
    throw new Error(`build missing onRequest: ${t.out}`);
  }
  console.log("built", t.out);
}

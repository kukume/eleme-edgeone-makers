import { build } from "esbuild";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packZip = process.argv.includes("--zip");

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

if (!packZip) {
  console.log("skip zip (cloud build). use: npm run pack");
  process.exit(0);
}

const dist = path.join(root, "dist-upload");
const zipPath = path.join(root, "eleme-edgeone-upload.zip");
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

function copy(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

copy(path.join(root, "public"), path.join(dist, "public"));
copy(path.join(root, "cloud-functions"), path.join(dist, "cloud-functions"));
copy(path.join(root, "package.json"), path.join(dist, "package.json"));
if (fs.existsSync(path.join(root, "package-lock.json"))) {
  copy(path.join(root, "package-lock.json"), path.join(dist, "package-lock.json"));
}
copy(path.join(root, "edgeone.json"), path.join(dist, "edgeone.json"));
copy(path.join(root, "src"), path.join(dist, "src"));
copy(path.join(root, "scripts"), path.join(dist, "scripts"));

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (name.includes("[") || name.includes("]")) {
      throw new Error(`illegal upload filename: ${path.join(dir, name)}`);
    }
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
  }
}
walk(dist);

fs.rmSync(zipPath, { force: true });
execFileSync(process.execPath, [path.join(root, "scripts/make-zip.mjs"), dist, zipPath], {
  stdio: "inherit",
});
console.log("upload zip:", zipPath);
console.log("routes:");
for (const t of targets) console.log(" -", t.out);

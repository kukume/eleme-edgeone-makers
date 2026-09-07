import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const dist = process.argv[2];
const zipPath = process.argv[3];

if (!dist || !zipPath) {
  console.error("usage: node scripts/make-zip.mjs <distDir> <zipPath>");
  process.exit(1);
}

function listFiles(dir, base = dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (name.includes("[") || name.includes("]")) {
      console.error("illegal upload filename:", path.relative(base, full));
      process.exit(1);
    }
    if (fs.statSync(full).isDirectory()) out.push(...listFiles(full, base));
    else out.push(path.relative(base, full));
  }
  return out;
}

const files = listFiles(dist);
console.log("packing", files.length, "files");

function findPython3() {
  for (const cmd of ["python", "python3", "py"]) {
    try {
      const out = execFileSync(cmd, ["-c", "import sys; print(sys.version_info[0])"], {
        encoding: "utf8",
      }).trim();
      if (out === "3") return cmd;
    } catch (_) {}
  }
  return null;
}

const py = findPython3();
if (py) {
  const pyScript = path.join(path.dirname(fileURLToPath(import.meta.url)), "make-zip.py");
  execFileSync(py, [pyScript, dist, zipPath], { stdio: "inherit" });
} else {
  fs.rmSync(zipPath, { force: true });
  const ps = `Compress-Archive -Path '${dist.replace(/'/g, "''")}\\*' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force`;
  execFileSync("powershell.exe", ["-NoProfile", "-Command", ps], { stdio: "inherit" });
  console.log("wrote zip via PowerShell:", zipPath);
}

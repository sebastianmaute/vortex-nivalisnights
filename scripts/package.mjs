// SPDX-License-Identifier: EUPL-1.2
// Zips dist/ into release/game-nivalisnights-<version>.zip with all files at the archive root
// (a nested top-level folder is the most common Vortex review failure).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const { name, version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const outDir = join(root, "release");
const out = join(outDir, `${name}-${version}.zip`);
mkdirSync(outDir, { recursive: true });
rmSync(out, { force: true });

const sevenZip = "C:\\Program Files\\7-Zip\\7z.exe";
if (existsSync(sevenZip)) {
  execFileSync(sevenZip, ["a", "-tzip", out, "*"], { cwd: join(root, "dist"), stdio: "inherit" });
} else {
  execFileSync(
    "powershell",
    ["-NoProfile", "-Command", `Compress-Archive -Path '${join(root, "dist")}\\*' -DestinationPath '${out}'`],
    { stdio: "inherit" },
  );
}
console.log(`packaged: ${out}`);

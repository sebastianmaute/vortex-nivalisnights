// SPDX-License-Identifier: EUPL-1.2
// Completes dist/ after tsc: game art, BepInEx.cfg, LICENSE, and info.json generated from package.json.
import { copyFileSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const dist = join(root, "dist");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

rmSync(join(dist, "gameart.jpg"), { force: true }); // replaced by gameart.png in 0.3.3
for (const file of ["gameart.png", "BepInEx.cfg"]) {
  copyFileSync(join(root, "assets", file), join(dist, file));
}
copyFileSync(join(root, "LICENSE"), join(dist, "LICENSE"));

const info = {
  name: pkg.config.game, // must match the game name on Nexus Mods; never include the version
  author: pkg.author,
  version: pkg.version,
  description: pkg.description,
  gameId: pkg.config.nexusGameId, // numerical Nexus Mods game id; Vortex lists the extension for this game
};
writeFileSync(join(dist, "info.json"), JSON.stringify(info, null, 2) + "\n");
console.log(`dist/ ready: ${info.name} ${info.version}`);

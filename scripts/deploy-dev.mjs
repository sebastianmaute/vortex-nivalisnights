// SPDX-License-Identifier: EUPL-1.2
// Copies dist/ into Vortex's user plugins folder for local testing. Restart Vortex afterwards.
import { cpSync, rmSync } from "node:fs";
import { join } from "node:path";

const appData = process.env.APPDATA;
if (!appData) {
  throw new Error("APPDATA is not set");
}
const target = join(appData, "Vortex", "plugins", "game-nivalisnights");
rmSync(target, { recursive: true, force: true });
cpSync(join(import.meta.dirname, "..", "dist"), target, { recursive: true });
console.log(`deployed to ${target} — restart Vortex to load it`);

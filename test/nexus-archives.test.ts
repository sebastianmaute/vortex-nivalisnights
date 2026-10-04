// SPDX-License-Identifier: EUPL-1.2
// Regression suite over file listings of real Nexus Mods archives (test/fixtures/nexus/*.json,
// generated from the downloads used in the 2026-10-04 clean-install test in Vortex 2.7.2).
import { readdirSync, readFileSync } from "fs";
import * as path from "path";

import { describe, expect, it } from "vitest";

import { GAME_ID } from "../src/common";
import {
  installBepInExAnchored,
  installLoosePlugin,
  isDoc,
  testBepInExAnchored,
  testBepInExPack,
  testLoosePlugin,
  testMelonLoader,
} from "../src/installers";

const dir = path.join(__dirname, "fixtures", "nexus");
const fixtures = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => ({ name: f, ...JSON.parse(readFileSync(path.join(dir, f), "utf8")) as { files: string[] } }));

/** Mirrors Vortex: installers in priority order, first match wins. */
async function install(files: string[]) {
  if ((await testBepInExPack(files, GAME_ID)).supported) return { by: "pack", instructions: [] as any[] };
  if ((await testMelonLoader(files, GAME_ID)).supported) return { by: "melonloader", instructions: [] as any[] };
  if ((await testBepInExAnchored(files, GAME_ID)).supported) return { by: "anchored", ...(await installBepInExAnchored(files)) };
  if ((await testLoosePlugin(files, GAME_ID)).supported) return { by: "loose", ...(await installLoosePlugin(files)) };
  return { by: "none", instructions: [] as any[] };
}

describe("every real Nexus archive", () => {
  it("has fixtures", () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(23);
  });

  for (const fx of fixtures) {
    it(`${fx.name}: claimed by our installers, no doubled path, no docs in shared folders`, async () => {
      const r = await install(fx.files);
      expect(r.by).not.toBe("none");
      const dests = r.instructions.filter((i) => i.type === "copy").map((i) => i.destination as string);
      expect(dests.length).toBeGreaterThan(0);
      for (const d of dests) {
        const segs = d.split(/[\\/]/).map((s) => s.toLowerCase());
        expect(segs).not.toContain("bepinex"); // destinations are relative to BepInEx/ or BepInEx/plugins/
        const sharedRoot = segs.length === 1 || (segs.length === 2 && segs[0] === "plugins");
        if (sharedRoot) expect(isDoc(d)).toBe(false);
      }
      // every DLL in the archive is deployed
      const dlls = fx.files.filter((f) => f.toLowerCase().endsWith(".dll")).map((f) => path.basename(f).toLowerCase());
      const deployed = dests.map((d) => path.basename(d).toLowerCase());
      for (const dll of dlls) expect(deployed).toContain(dll);
    });
  }
});

describe("isDoc", () => {
  it("recognises extensionless and name-based docs", () => {
    for (const f of ["LICENSE", "LICENCE", "COPYING", "NOTICE", "README", "CHANGELOG", "LICENSE.txt", "README.fr.md", "CHANGELOG.md", "AUTHORS", "CREDITS"]) {
      expect(isDoc(f)).toBe(true);
    }
    for (const f of ["Foo.dll", "foo.cfg", "NivalisModKit.xml", "license.dll", "Sounds"]) {
      expect(isDoc(f)).toBe(false);
    }
  });
});

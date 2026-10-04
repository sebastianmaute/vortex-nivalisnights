import { readFileSync } from "fs";
import * as path from "path";

import { describe, expect, it } from "vitest";

import { GAME_ID, MODTYPE_BEPINEX_INJECTOR, MODTYPE_BEPINEX_PLUGIN, MODTYPE_BEPINEX_ROOT } from "../src/common";
import {
  installBepInExAnchored,
  installBepInExPack,
  testBepInExPack,
  installLoosePlugin,
  installMelonLoader,
  MELONLOADER_MESSAGE,
  testBepInExAnchored,
  testLoosePlugin,
  testMelonLoader,
} from "../src/installers";

const fixture = (name: string): string[] =>
  JSON.parse(readFileSync(path.join(__dirname, "fixtures", `${name}.json`), "utf8").replace(/^﻿/, "")).files;

const S = path.sep;
const p = (...segs: string[]) => segs.join(S);

type Installer = {
  test: (files: string[], gameId: string) => Promise<{ supported: boolean }>;
};
const INSTALLERS: Record<string, Installer> = {
  melonloader: { test: testMelonLoader },
  anchored: { test: testBepInExAnchored },
  loose: { test: testLoosePlugin },
};

/** Which of our installers claim the archive (in priority order, like Vortex). */
async function claimedBy(files: string[], gameId = GAME_ID): Promise<string[]> {
  const out: string[] = [];
  for (const [name, inst] of Object.entries(INSTALLERS)) {
    if ((await inst.test(files, gameId)).supported) out.push(name);
  }
  return out;
}

const copies = (r: { instructions: any[] }) =>
  r.instructions.filter((i) => i.type === "copy").map((i) => i.destination).sort();
const modType = (r: { instructions: any[] }) =>
  r.instructions.find((i) => i.type === "setmodtype")?.value;

describe("BepInEx loader pack", () => {
  it("pack (#25) -> loader + SplashScreen patcher; bundled Timestamp plugin dropped", async () => {
    const files = fixture("bepinex-pack");
    expect((await testBepInExPack(files, GAME_ID)).supported).toBe(true);
    const r = await installBepInExPack(files);
    const dest = copies(r);
    expect(dest).toContain("winhttp.dll");
    expect(dest).toContain("doorstop_config.ini");
    expect(dest).toContain(".doorstop_version");
    expect(dest).toContain(p("BepInEx", "core", "BepInEx.Unity.IL2CPP.dll"));
    expect(dest).toContain(p("BepInEx", "config", "BepInEx.cfg"));
    expect(dest).toContain(p("dotnet", "coreclr.dll"));
    expect(dest.filter((d) => d.startsWith(p("BepInEx", "plugins")))).toEqual([]);
    expect(dest).toContain(p("BepInEx", "patchers", "BepInEx.SplashScreen", "BepInEx.SplashScreen.GUI.exe"));
    expect(dest).toContain(p("BepInEx", "patchers", "BepInEx.SplashScreen", "BepInEx.SplashScreen.Patcher.BepInEx6.dll"));
    const data = files.filter((f) => !f.endsWith("\\"));
    const extras = data.filter((f) => /^BepInEx\\plugins\\/.test(f));
    expect(extras).toEqual([p("BepInEx", "plugins", "Tobey", "Tobey.BepInEx.Timestamp.dll")]);
    expect(dest).toHaveLength(data.length - extras.length);
    expect(modType(r)).toBe(MODTYPE_BEPINEX_INJECTOR);
    expect(r.instructions).toContainEqual({ type: "attribute", key: "customFileName", value: "Bepis Injector Extensible" });
  });

  it("pack wrapped in a top-level folder is unwrapped", async () => {
    const files = fixture("bepinex-pack").map((f) => p("BepInEx_IL2CPP_6.0.0-be.788", f));
    expect((await testBepInExPack(files, GAME_ID)).supported).toBe(true);
    expect(copies(await installBepInExPack(files))).toContain("winhttp.dll");
  });

  it("regular mods and other games are not treated as a loader pack", async () => {
    for (const name of ["trainer", "modkit", "ambience"]) {
      expect((await testBepInExPack(fixture(name), GAME_ID)).supported).toBe(false);
    }
    expect((await testBepInExPack(fixture("bepinex-pack"), "valheim")).supported).toBe(false);
  });
});

describe("real Nexus archives", () => {
  it("Trainer (BepInEx/plugins/X.dll + docs at root) -> anchored, docs dropped", async () => {
    const files = fixture("trainer");
    expect(await claimedBy(files)).toEqual(["anchored"]);
    const r = await installBepInExAnchored(files);
    expect(copies(r)).toEqual([p("plugins", "NivalisTrainer.dll")]);
    expect(modType(r)).toBe(MODTYPE_BEPINEX_ROOT);
  });

  it("ModKit (dll + xml docs file in plugins) -> anchored, keeps the xml (not a doc type)", async () => {
    const files = fixture("modkit");
    expect(await claimedBy(files)).toEqual(["anchored"]);
    expect(copies(await installBepInExAnchored(files))).toEqual([
      p("plugins", "NivalisModKit.dll"),
      p("plugins", "NivalisModKit.xml"),
    ]);
  });

  it("Ambience (folder per mod with assets + README) -> anchored, folder kept intact", async () => {
    const files = fixture("ambience");
    expect(await claimedBy(files)).toEqual(["anchored"]);
    const dest = copies(await installBepInExAnchored(files));
    expect(dest).toContain(p("plugins", "NivalisAmbience", "NivalisAmbience.dll"));
    expect(dest).toContain(p("plugins", "NivalisAmbience", "README.txt"));
    expect(dest).toContain(p("plugins", "NivalisAmbience", "Sounds", "Events", "chatter", "chatter.wav"));
    expect(dest).toHaveLength(files.filter((f) => !f.endsWith("\\")).length);
  });

  it("BepInEx pack -> claimed by none of the mod installers (the pack installer, prio 5, owns it)", async () => {
    expect(await claimedBy(fixture("bepinex-pack"))).toEqual([]);
  });
});

describe("other layouts", () => {
  it("wrapper folder above BepInEx is stripped", async () => {
    const files = [p("MyMod-1.0", "BepInEx") + S, p("MyMod-1.0", "BepInEx", "plugins", "MyMod.dll")];
    expect(await claimedBy(files)).toEqual(["anchored"]);
    expect(copies(await installBepInExAnchored(files))).toEqual([p("plugins", "MyMod.dll")]);
  });

  it("forward-slash separators are handled", async () => {
    const files = ["BepInEx/plugins/Foo/Foo.dll", "BepInEx/config/foo.cfg"];
    expect(await claimedBy(files)).toEqual(["anchored"]);
    expect(copies(await installBepInExAnchored(files))).toEqual([p("config", "foo.cfg"), p("plugins", "Foo", "Foo.dll")]);
  });

  it("lowercase bepinex folder is recognised", async () => {
    expect(await claimedBy([p("bepinex", "plugins", "a.dll")])).toEqual(["anchored"]);
  });

  it("BepInEx folder plus non-doc root files (loader-like) is left alone", async () => {
    expect(await claimedBy([p("BepInEx", "plugins", "a.dll"), "winhttp.dll", "doorstop_config.ini"])).toEqual([]);
  });

  it("bare dll at root -> loose plugin, flat into plugins, docs dropped", async () => {
    const files = ["Foo.dll", "README.md"];
    expect(await claimedBy(files)).toEqual(["loose"]);
    const r = await installLoosePlugin(files);
    expect(copies(r)).toEqual(["Foo.dll"]);
    expect(modType(r)).toBe(MODTYPE_BEPINEX_PLUGIN);
  });

  it("dll in its own folder keeps the folder, extra wrapper removed", async () => {
    const files = [
      p("Foo-v2", "Foo") + S,
      p("Foo-v2", "Foo", "Foo.dll"),
      p("Foo-v2", "Foo", "assets", "a.png"),
      p("Foo-v2", "readme.txt"),
    ];
    expect(await claimedBy(files)).toEqual(["loose"]);
    expect(copies(await installLoosePlugin(files))).toEqual([p("Foo", "Foo.dll"), p("Foo", "assets", "a.png")]);
  });

  it("plugins/-rooted archives are left to modtype-bepinex", async () => {
    expect(await claimedBy([p("plugins", "Foo.dll")])).toEqual([]);
  });

  it("standalone tools with an exe are not treated as plugins", async () => {
    expect(await claimedBy(["SaveEditor.exe", "Newtonsoft.Json.dll"])).toEqual([]);
  });

  it("archives without dlls or BepInEx folder are not claimed", async () => {
    expect(await claimedBy(["readme.txt", p("music", "track.ogg")])).toEqual([]);
  });
});

describe("MelonLoader builds", () => {
  it("Mods/X.dll is refused with a fatal error explaining the BepInEx variant", async () => {
    const files = [p("Mods", "NivalisTrainer.dll"), "README.md"];
    expect(await claimedBy(files)).toEqual(["melonloader"]);
    const r = await installMelonLoader();
    expect(r.instructions).toEqual([{ type: "error", value: "fatal", source: MELONLOADER_MESSAGE }]);
  });

  it("mixed MelonLoader + BepInEx archive is ambiguous: not refused, not claimed (falls through)", async () => {
    const files = [p("Mods", "a.dll"), p("BepInEx", "plugins", "a.dll")];
    expect(await claimedBy(files)).toEqual([]);
  });
});

describe("game filter", () => {
  it("never claims archives for other games", async () => {
    expect(await claimedBy(fixture("trainer"), "skyrimspecialedition")).toEqual([]);
    expect(await claimedBy(["Foo.dll"], "valheim")).toEqual([]);
    expect(await claimedBy([p("Mods", "a.dll")], "valheim")).toEqual([]);
  });
});

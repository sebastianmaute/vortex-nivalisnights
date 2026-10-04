import * as path from "path";

import type { types } from "@nexusmods/vortex-api";

import { EXECUTABLE, GAME_ID, MODTYPE_BEPINEX_INJECTOR, MODTYPE_BEPINEX_PLUGIN, MODTYPE_BEPINEX_ROOT } from "./common";

// Archive entries reach installers with path.sep separators, but some extraction backends
// produce "/" — every helper here accepts both.
const SEP_RE = /[\\/]/;

export const isDir = (file: string): boolean => file.endsWith("/") || file.endsWith("\\");
export const segmentsOf = (file: string): string[] => file.split(SEP_RE).filter((s) => s.length > 0);
const extOf = (file: string): string => path.extname(file).toLowerCase();
const dataFiles = (files: string[]): string[] => files.filter((f) => !isDir(f));

/** Readme-style files: dropped when they would land in a shared folder (conflict-prone, useless there). */
const DOC_EXTENSIONS = new Set([".md", ".txt", ".pdf", ".url", ".html", ".png", ".jpg", ".jpeg", ".gif", ".webp"]);
// Recognised by name too, with or without an extension (e.g. an extensionless "LICENSE" — Boat Decor ships one).
const DOC_NAMES = /^(license|licence|copying|notice|readme|changelog|changes|authors|credits|contributors)(\.[a-z]{2})?(\.(md|txt|rst))?$/i;
export const isDoc = (file: string): boolean => {
  const base = path.basename(file.replace(/[\\/]+$/, ""));
  return DOC_EXTENSIONS.has(extOf(base)) || DOC_NAMES.test(base);
};

const unsupported = (): Promise<types.ISupportedResult> =>
  Promise.resolve({ supported: false, requiredFiles: [] });
const supported = (): Promise<types.ISupportedResult> =>
  Promise.resolve({ supported: true, requiredFiles: [] });

const bepinexIndex = (file: string): number =>
  segmentsOf(file).findIndex((s) => s.toLowerCase() === "bepinex");

const ROOT_DIRS = new Set(["plugins", "config", "patchers"]);

// ---------------------------------------------------------------------------------------------
// 0. The BepInEx loader pack itself (Nexus #25 or any IL2CPP BepInEx 6 build): doorstop proxy at
//    the root plus BepInEx/core. Installed like modtype-bepinex's injector installer would (same
//    mod type, so its download/update/enable logic keeps working), but without the plugins the
//    pack bundles (the Timestamp plugin, which only queries time.cloudflare.com and logs the
//    time). Patchers (the loading splash screen) are kept.
// ---------------------------------------------------------------------------------------------

const LOADER_CORE = "bepinex.unity.il2cpp.dll";
const DOORSTOP_PROXY = "winhttp.dll";

/** Index of the "BepInEx" segment in the path of the loader's core DLL, or -1. */
const loaderCoreAnchor = (file: string): number => {
  const segs = segmentsOf(file).map((s) => s.toLowerCase());
  const n = segs.length;
  return n >= 3 && segs[n - 1] === LOADER_CORE && segs[n - 2] === "core" && segs[n - 3] === "bepinex" ? n - 3 : -1;
};

export function testBepInExPack(files: string[], gameId: string): Promise<types.ISupportedResult> {
  if (gameId !== GAME_ID) {
    return unsupported();
  }
  const data = dataFiles(files);
  const core = data.find((f) => loaderCoreAnchor(f) !== -1);
  if (core === undefined) {
    return unsupported();
  }
  const prefix = segmentsOf(core).slice(0, loaderCoreAnchor(core)).join("/").toLowerCase();
  const proxy = data.some((f) => {
    const segs = segmentsOf(f);
    return segs[segs.length - 1].toLowerCase() === DOORSTOP_PROXY && segs.slice(0, -1).join("/").toLowerCase() === prefix;
  });
  return proxy ? supported() : unsupported();
}

export const INJECTOR_NAME = "Bepis Injector Extensible";

// BepInEx.SplashScreen (RenameExe=true, its default) launches "<process name>.SplashScreen.GUI.exe" and
// renames the shipped "BepInEx.SplashScreen.GUI.exe" to that name if it is missing. Renaming a deployed
// file looks like an external deletion to Vortex, so deploy it under the final name right away.
const SPLASH_GUI_ORIG = "bepinex.splashscreen.gui.exe";
export const SPLASH_GUI_NAME = `${path.basename(EXECUTABLE, ".exe")}.SplashScreen.GUI.exe`;

export function installBepInExPack(files: string[]): Promise<types.IInstallResult> {
  const data = dataFiles(files);
  const core = data.find((f) => loaderCoreAnchor(f) !== -1)!;
  const prefixLen = loaderCoreAnchor(core);
  const prefix = segmentsOf(core).slice(0, prefixLen).map((s) => s.toLowerCase());
  const instructions: types.IInstruction[] = [];
  for (const file of data) {
    const segs = segmentsOf(file);
    if (segs.length <= prefixLen || !prefix.every((p, i) => segs[i].toLowerCase() === p)) {
      continue; // outside the folder that holds the loader
    }
    const rel = segs.slice(prefixLen);
    const isExtra = rel.length >= 3 && rel[0].toLowerCase() === "bepinex" && rel[1].toLowerCase() === "plugins";
    if (isExtra) {
      continue;
    }
    if (rel[rel.length - 1].toLowerCase() === SPLASH_GUI_ORIG) {
      rel[rel.length - 1] = SPLASH_GUI_NAME;
    }
    instructions.push({ type: "copy", source: file, destination: rel.join(path.sep) });
  }
  instructions.push({ type: "setmodtype", value: MODTYPE_BEPINEX_INJECTOR });
  instructions.push({ type: "attribute", key: "customFileName", value: INJECTOR_NAME });
  return Promise.resolve({ instructions });
}

// ---------------------------------------------------------------------------------------------
// 1. MelonLoader builds — this extension uses BepInEx; refuse with a helpful message.
// ---------------------------------------------------------------------------------------------

const isMelonLoaderFile = (file: string): boolean => {
  const segs = segmentsOf(file).map((s) => s.toLowerCase());
  if (segs.includes("melonloader") || segs.includes("userlibs")) {
    return true;
  }
  // MelonLoader mods ship as Mods/<name>.dll (relative to the game root).
  return segs.length === 2 && segs[0] === "mods" && extOf(file) === ".dll";
};

export function testMelonLoader(files: string[], gameId: string): Promise<types.ISupportedResult> {
  if (gameId !== GAME_ID) {
    return unsupported();
  }
  const data = dataFiles(files);
  const melon = data.some(isMelonLoaderFile);
  const bepinex = data.some((f) => bepinexIndex(f) !== -1);
  return melon && !bepinex ? supported() : unsupported();
}

export const MELONLOADER_MESSAGE =
  "This archive is a MelonLoader build. Nivalis Nights support in Vortex uses BepInEx 6 — " +
  "please download the BepInEx version of this mod from its Nexus Mods page instead.";

export function installMelonLoader(): Promise<types.IInstallResult> {
  return Promise.resolve({
    instructions: [{ type: "error", value: "fatal", source: MELONLOADER_MESSAGE }],
  });
}

// ---------------------------------------------------------------------------------------------
// 2. Archives packed relative to the game root: BepInEx/plugins/..., BepInEx/config/...
//    (the dominant convention for Nivalis Nights mods). Strip everything up to and including
//    the "BepInEx" segment and deploy to <game>/BepInEx via the bepinex-root mod type.
// ---------------------------------------------------------------------------------------------

export function testBepInExAnchored(files: string[], gameId: string): Promise<types.ISupportedResult> {
  if (gameId !== GAME_ID) {
    return unsupported();
  }
  const data = dataFiles(files);
  const inside = data.filter((f) => {
    const idx = bepinexIndex(f);
    return idx !== -1 && idx < segmentsOf(f).length - 1;
  });
  if (inside.length === 0) {
    return unsupported();
  }
  // Anything outside the BepInEx folder other than docs (e.g. winhttp.dll, doorstop files) means
  // this is a loader package or something unusual — leave it to other installers.
  const outside = data.filter((f) => bepinexIndex(f) === -1);
  return outside.every(isDoc) ? supported() : unsupported();
}

export function installBepInExAnchored(files: string[]): Promise<types.IInstallResult> {
  const instructions: types.IInstruction[] = [];
  for (const file of dataFiles(files)) {
    const segs = segmentsOf(file);
    const idx = segs.findIndex((s) => s.toLowerCase() === "bepinex");
    if (idx === -1) {
      continue; // docs next to the BepInEx folder
    }
    const rel = segs.slice(idx + 1);
    // Docs dropped directly into BepInEx/ or BepInEx/plugins/ would collide between mods.
    const sharedFolder = rel.length === 1 || (rel.length === 2 && rel[0].toLowerCase() === "plugins");
    if (sharedFolder && isDoc(file)) {
      continue;
    }
    instructions.push({ type: "copy", source: file, destination: rel.join(path.sep) });
  }
  instructions.push({ type: "setmodtype", value: MODTYPE_BEPINEX_ROOT });
  return Promise.resolve({ instructions });
}

// ---------------------------------------------------------------------------------------------
// 3. Bare plugins: DLL(s) without a BepInEx folder, optionally wrapped in a mod folder.
//    Deploy to <game>/BepInEx/plugins via the bepinex-plugin mod type.
// ---------------------------------------------------------------------------------------------

export function testLoosePlugin(files: string[], gameId: string): Promise<types.ISupportedResult> {
  if (gameId !== GAME_ID) {
    return unsupported();
  }
  const data = dataFiles(files);
  if (!data.some((f) => extOf(f) === ".dll")) {
    return unsupported();
  }
  if (data.some((f) => extOf(f) === ".exe")) {
    return unsupported(); // standalone tools (e.g. save editors) are not plugins
  }
  if (data.some((f) => bepinexIndex(f) !== -1 || isMelonLoaderFile(f))) {
    return unsupported();
  }
  // plugins/, config/, patchers/ at the archive root are handled by modtype-bepinex.
  if (data.some((f) => ROOT_DIRS.has(segmentsOf(f)[0].toLowerCase()))) {
    return unsupported();
  }
  return supported();
}

export function installLoosePlugin(files: string[]): Promise<types.IInstallResult> {
  const data = dataFiles(files);
  const dlls = data.filter((f) => extOf(f) === ".dll");
  const shallowest = dlls.reduce((a, b) => (segmentsOf(b).length < segmentsOf(a).length ? b : a));
  const dllSegs = segmentsOf(shallowest);

  // DLL in a folder: keep that folder as the plugin's own subfolder (plugins/<ModName>/...),
  // dropping any wrapper levels above it. DLL at the archive root: install flat into plugins/.
  const keepFolder = dllSegs.length >= 2;
  const prefix = keepFolder ? dllSegs.slice(0, dllSegs.length - 2) : [];

  const instructions: types.IInstruction[] = [];
  for (const file of data) {
    const segs = segmentsOf(file);
    const underPrefix = prefix.every((p, i) => segs[i]?.toLowerCase() === p.toLowerCase());
    if (!underPrefix || segs.length <= prefix.length) {
      continue;
    }
    const rel = segs.slice(prefix.length);
    if (rel.length === 1 && isDoc(file)) {
      continue; // loose docs would land directly in the shared plugins folder
    }
    instructions.push({ type: "copy", source: file, destination: rel.join(path.sep) });
  }
  instructions.push({ type: "setmodtype", value: MODTYPE_BEPINEX_PLUGIN });
  return Promise.resolve({ instructions });
}

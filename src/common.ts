// SPDX-License-Identifier: EUPL-1.2
/** Nexus Mods domain (nexusmods.com/nivalisnights) — also the Vortex game id. */
export const GAME_ID = "nivalisnights";
export const GAME_NAME = "Nivalis Nights";
export const STEAMAPP_ID = "1488490";
export const EXECUTABLE = "Nivalis Nights.exe";

/**
 * BepInEx IL2CPP Pack for Nivalis Nights (nexusmods.com/nivalisnights/mods/25), file 48 = v1.0.0.
 * Contains BepInEx 6.0.0-be.788 — the build the community's IL2CPP plugins target. Vortex's own
 * GitHub-based download would fetch a 6.0.0-pre release instead, which these plugins don't support.
 */
export const BEPINEX_PACK = {
  modId: 25,
  fileId: 48,
  version: "1.0.0",
  archiveName: "BepInEx IL2CPP Pack For Nivalis Nights v1.0.0.zip",
} as const;

/** Mod types registered by Vortex's bundled modtype-bepinex extension once the game is added to it. */
export const MODTYPE_BEPINEX_INJECTOR = "bepinex-injector"; // deploys to the game root; marks "the" BepInEx install
export const MODTYPE_BEPINEX_ROOT = "bepinex-root";
export const MODTYPE_BEPINEX_PLUGIN = "bepinex-plugin";

/**
 * Installer priorities: Vortex tries lower numbers first, and the first installer that accepts an
 * archive wins. Built-ins: modtype-bepinex 10 (BepInEx pack, plugins/config/patchers-rooted mods),
 * FOMOD 10/20, fallback 1000. Our mod installers run after those; the loader-pack installer runs
 * before modtype-bepinex's injector installer so it can leave out the pack's bundled extras.
 */
export const PRIORITY = {
  bepinexPack: 5,
  // 21-23: after FOMOD (20) but before 25, the slot most community game extensions use — some of
  // those don't answer correctly for other games (e.g. Bannerlord's returns undefined -> "Buggy
  // installer" log errors), so we claim our archives first. Our tests check the game id strictly.
  melonLoader: 21,
  bepinexAnchored: 22,
  loosePlugin: 23,
} as const;

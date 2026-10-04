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
export const MODTYPE_BEPINEX_ROOT = "bepinex-root";
export const MODTYPE_BEPINEX_PLUGIN = "bepinex-plugin";

/**
 * Installer priorities: Vortex tries lower numbers first, and the first installer that accepts an
 * archive wins. Built-ins: modtype-bepinex 10 (BepInEx pack, plugins/config/patchers-rooted mods),
 * FOMOD 10/20, fallback 1000. Ours run after those.
 */
export const PRIORITY = {
  melonLoader: 25,
  bepinexAnchored: 26,
  loosePlugin: 27,
} as const;

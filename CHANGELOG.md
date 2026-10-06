# Changelog

## 0.3.2 — 2026-10-06

- Archives in the Thunderstore layout (`manifest.json`, `icon.png`, `README.md` next to `BepInEx/plugins/`) are installed
  correctly. 0.3.1 declined them because of `manifest.json`, so Vortex's fallback installer and the `bepinex-plugin` mod
  type deployed them to `BepInEx/plugins/BepInEx/plugins/` with the metadata loose in `plugins/`. Affected: Nivalis ModKit
  0.5.0, Nivals Borderless 1.0.0, Nivalis Free Cursor 1.0.0. Reinstall those mods after updating.
- Regression suite now covers 48 real archives, including every mod added up to 2026-10-06.

## 0.3.1 — 2026-10-05

- Always installs the newest BepInEx IL2CPP Pack: the newest main file of
  [mods/25](https://www.nexusmods.com/nivalisnights/mods/25) is looked up on Nexus Mods when Vortex needs BepInEx.
  0.3.0 had file 48 (v1.0.0) built in, which the pack author has since archived.
- If Nexus Mods can't be reached, the built-in fallback is file 182 (v1.0.1). The Vortex log says which file was used.
- Existing installations are not touched: Vortex only downloads the pack when BepInEx isn't installed yet.

## 0.3.0 — first public release

- Licensed under EUPL-1.2; `LICENSE` ships in the extension archive.
- `info.json` name is now "Nivalis Nights" (matches the game on Nexus Mods).
- Includes everything from the 0.1.0–0.2.4 development builds below.

## 0.2.4 — 2026-10-04 (dev build)

- `requiresCleanup: true`: Vortex removes empty folders it created when mods are removed or moved (it defaults to off
  with `mergeMods: true`, which left e.g. an empty `BepInEx/plugins/BepInEx/plugins/NivalisBoatDecor` behind).

## 0.2.3 — 2026-10-04 (dev build)

- Docs are also recognised by name with or without extension (`LICENSE`, `COPYING`, `README`, …). Boat Decor ships an
  extensionless `LICENSE` next to `BepInEx/`, so 0.2.2 declined it and Vortex's fallback + the `bepinex-plugin` mod type
  deployed it to `BepInEx/plugins/BepInEx/plugins/...`.
- Regression suite over 23 real Nexus archives (`test/fixtures/nexus/`).

## 0.2.2 — 2026-10-04 (dev build)

- Deploy the splash GUI as `Nivalis Nights.SplashScreen.GUI.exe` — the name BepInEx.SplashScreen launches. It renamed
  the shipped `BepInEx.SplashScreen.GUI.exe` at every game start, which Vortex reported as an external deletion
  (and which blocked a staging-folder move behind Vortex's busy overlay).

## 0.2.1 — 2026-10-04 (dev build)

- Keep the pack's BepInEx.SplashScreen patcher (loading splash) — only the bundled Timestamp plugin is left out.

## 0.2.0 — 2026-10-04 (dev build)

- BepInEx pack installed by our own installer (priority 5): same `bepinex-injector` mod type as Vortex's, but without
  the pack's bundled Timestamp plugin and SplashScreen patcher (≈450 log warnings and a false "chainloader has crashed"
  splash error).
- Mod installers moved to priorities 21–23 (after FOMOD, before the common 25 slot) so third-party extensions that
  mishandle other games' archives (e.g. Bannerlord's "Buggy installer") are no longer consulted for Nivalis mods.

## 0.1.0 — 2026-10-04 (dev build, tested in Vortex 2.7.2)

- Steam discovery (app 1488490), game art, Nexus domain `nivalisnights`.
- BepInEx 6 IL2CPP via Vortex's BepInEx extension, using the community pack (Nexus #25, BepInEx 6.0.0-be.788).
- Installers: `BepInEx/`-relative archives, bare plugin DLLs, refusal of MelonLoader builds.

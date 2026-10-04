# Changelog

## 0.2.1 — unreleased

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

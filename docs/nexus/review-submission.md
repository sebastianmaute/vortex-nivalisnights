# Vortex extension review request

Form: https://github.com/Nexus-Mods/Vortex/issues/new?assignees=&labels=extension+%3Agear%3A&projects=&template=review-extension.yaml&title=Review%3A+Game+Name

Title: `Review: Nivalis Nights`

Answers to prepare (adapt to the form's current fields):

- **Game:** Nivalis Nights — https://www.nexusmods.com/nivalisnights (Steam app 1488490; Epic announced, not released)
- **Extension page:** *(Nexus Mods URL after upload)*
- **Version:** 0.3.0
- **Source code:** *(GitHub URL if public)*
- **Modding framework:** BepInEx 6 IL2CPP (Unity 2020.3, IL2CPP). Registers with the bundled `modtype-bepinex` and uses
  `customPackDownloader` to fetch nivalisnights #25 (file 48, BepInEx 6.0.0-be.788). The GitHub default would select a
  6.0.0-pre release, which the game's community plugins don't target.
- **Installers:** own pack installer (prio 5; same `bepinex-injector` mod type, drops the pack's bundled Timestamp
  plugin, deploys the splash GUI under the name the patcher launches so no external change is reported); MelonLoader
  refusal (21); `BepInEx/`-relative archives → `bepinex-root` (22); bare DLLs → `bepinex-plugin` (23). All mod types
  used are registered by modtype-bepinex. `requiresCleanup: true`.
- **Testing done:** Vortex 2.7.2, clean game install, hardlink deployment, 23 popular Nexus mods installed via
  "Mod Manager Download" (all deploy correctly, 24 plugins load, no duplicates, no external-change prompts).
  44 unit tests incl. regression tests over those 23 archives' file listings.
- **Known limitations:** no collections exist for the game yet (collection install untested); the splash screen
  patcher logs harmless TypeLoad warnings; the game itself crashes on exit (also without mods).
- **Dependencies:** none beyond Vortex and the bundled modtype-bepinex.

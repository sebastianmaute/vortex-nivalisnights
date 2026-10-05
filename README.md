# Vortex support for Nivalis Nights

A [Vortex](https://www.nexusmods.com/about/vortex/) game extension for
[Nivalis Nights](https://store.steampowered.com/app/1488490/) ([Nexus Mods](https://www.nexusmods.com/nivalisnights)).
**Download:** [Nexus Mods](https://www.nexusmods.com/site/mods/2413) or Vortex's Extensions tab (once approved by the Vortex team). This repository
holds the source; the research behind it is in [vortex-extension-groundwork](https://github.com/sebastianmaute/vortex-extension-groundwork).

## What it does

- **Discovers the game** on Steam (app `1488490`). Epic is announced for later — add its id to `queryArgs` when known.
- **Installs BepInEx 6 automatically**: registers the game with Vortex's bundled BepInEx extension and points it at the
  community [BepInEx IL2CPP Pack](https://www.nexusmods.com/nivalisnights/mods/25). The newest main file is looked up on
  Nexus Mods at download time, so a new pack release needs no extension update (offline fallback: file 182, v1.0.1).
  Vortex's default GitHub download would pick a `6.0.0-pre` release, which the community's IL2CPP plugins don't target.
- **Installs mods correctly** whatever the archive layout:

| Archive layout | Example | Installer | Deploys to |
|---|---|---|---|
| BepInEx pack (`winhttp.dll`, `BepInEx/core`, `dotnet/`) | Nexus #25 | `nivalisnights-bepinex-pack` (5) — loader + splash screen, bundled Timestamp plugin dropped | game root |
| `plugins/` / `config/` / `patchers/` at root | — | modtype-bepinex root (prio 10) | `BepInEx/` |
| FOMOD | — | Vortex FOMOD (prio 10/20) | game root |
| **`BepInEx/...`** relative to game root (the common case) | Trainer, ModKit, Ambience | `nivalisnights-bepinex-anchored` (22) | `BepInEx/` |
| Bare DLL(s), optionally in a mod folder | — | `nivalisnights-loose-plugin` (23) | `BepInEx/plugins/` |
| MelonLoader build (`Mods/*.dll`, `MelonLoader/`) | Trainer's ML file | `nivalisnights-melonloader` (21) | **refused** with a message to get the BepInEx file |
| Anything else (e.g. standalone tools with an `.exe`) | Save Editor | Vortex fallback (1000) | game root |

Docs that would land in a shared folder (`BepInEx/plugins/README.md`, root-level readmes) are dropped to avoid
conflicts between mods; docs inside a mod's own folder are kept.

### Why our own installers are needed

Most Nivalis Nights mods are packed as `BepInEx/plugins/...`. Vortex's BepInEx extension only recognises archives that
start at `plugins/`, `config/` or `patchers/`, and without a matching installer its `bepinex-plugin` mod type (which
matches any `.dll`) would deploy them to `BepInEx/plugins/BepInEx/plugins/...`. The anchored installer strips the
prefix and sets the mod type explicitly. All mod types used (`bepinex-root`, `bepinex-plugin`) are registered by the
BepInEx extension — an unregistered mod type would silently never deploy.

## Development

Requires Node 22+ and npm. `.npmrc` sets `legacy-peer-deps` (vortex-api's React 18 peers conflict with react-select's
range; Vortex supplies these at runtime).

```sh
npm install
npm test            # installer unit tests (fixtures = listings of real Nexus archives)
npm run typecheck
npm run deploy:dev  # build + copy to %APPDATA%\Vortex\plugins\game-nivalisnights, then restart Vortex
npm run package     # build + release/game-nivalisnights-<version>.zip (files at archive root)
```

Layout: `src/index.ts` (registration), `src/installers.ts` (pure installer logic), `src/common.ts` (ids, priorities),
`assets/` (`gameart.jpg` 400×600, `BepInEx.cfg`, `nexus/header-640x360.jpg` for the mod page),
`test/fixtures/` (file lists from real archives).

The TypeScript build uses plain `tsc` (CommonJS). `@nexusmods/vortex-api` is mapped to its type file via `paths`
because the package only exposes types through `exports`; at runtime Vortex resolves the module itself.

## Testing in Vortex — checklist

> ⚠️ If the game folder already contains a manually installed BepInEx, back up `<game>/BepInEx`, `<game>/dotnet`,
> `winhttp.dll`, `doorstop_config.ini` and `.doorstop_version` before letting Vortex manage the game — Vortex meets
> existing files when it deploys (it keeps them as `*.vortex_backup` and restores them on purge).

1. `npm run deploy:dev`, restart Vortex; Extensions tab shows "Nivalis Nights" without errors.
2. Games → Nivalis Nights is discovered via Steam → Manage. Put the staging folder on the game's drive for hardlinks.
3. BepInEx pack is downloaded/installed as "Bepis Injector Extensible"; enable + deploy → `winhttp.dll`,
   `BepInEx/core`, `dotnet/` in the game root.
4. Install the three sample archives (Trainer, ModKit, Ambience) → deployed under `BepInEx/plugins/...`, no doubled paths.
5. Install the Trainer's MelonLoader file → refused with the explanatory message.
6. Launch the game from Vortex → `BepInEx/LogOutput.log` shows the plugins loading.
7. Before release (per Nexus review): install the top ~10 mods, test a clean install, test a collection.

## Status

`0.3.0` — first public release. Unit-tested (44 tests), and tested in Vortex 2.7.2 on 2026-10-04 (0.1.0–0.2.4):

- ✅ Extension loads; game discovered via Steam; BepInEx pack (#25) downloaded from Nexus and installed by
  modtype-bepinex as "Bepis Injector Extensible" (mod type `bepinex-injector`).
- ✅ Trainer, ModKit, Ambience installed by `nivalisnights-bepinex-anchored` (type `bepinex-root`), deployed to
  `BepInEx/plugins/...` — no doubled paths, Trainer docs not dumped in the game root.
- ✅ Game launched from Vortex: BepInEx 6.0.0-be.788 loaded 25 plugins, mods active at the main menu.
- ✅ Pre-existing manually installed files were kept as `*.vortex_backup` and replaced by links (restored on purge).
- ✅ 0.2.0 re-test (hardlink deployment, staging on the game drive): pack reinstalled without Timestamp/SplashScreen;
  `LogOutput.log` has 0 TypeLoadExceptions, 0 HarmonyX warnings, no Splash error; 24 plugins load; the only warnings
  are Il2CppInterop notes from the Tool Belt plugin that also appear without Vortex.
- ✅ 0.2.2 re-test: splash GUI deployed as `Nivalis Nights.SplashScreen.GUI.exe`, not renamed at launch (still
  hard-linked), no external changes reported by Vortex, 24 plugins, console and splash both enabled. (That run had
  no Splash "crashed" error, but it reappeared later — it is intermittent, see Known issues.) The ~450 TypeLoad warnings from the splash patcher remain (accepted).
- ✅ Clean install (vanilla game folder) + 23 popular mods downloaded via "Mod Manager Download" (two `.rar`): 22
  installed correctly by our installers (anchored, loose plugin with/without folder, wrapped archive, mod with a
  config file); 24 plugins load, nothing loaded twice. Boat Decor was mis-deployed (doubled path) because of an
  extensionless `LICENSE` file → fixed in 0.2.3, all 23 archives are now regression tests.
  Re-test after reinstalling Boat Decor with 0.2.3/0.2.4: claimed by the anchored installer, loads from
  `BepInEx/plugins/NivalisBoatDecor/`, 24 plugins, no Buggy-installer errors.
- ⬜ MelonLoader refusal, Save Editor (standalone exe), collection (none exist on Nexus yet) — not yet tested in Vortex.

### Known issues / notes

- **Pack extras**: the #25 pack ships the *Timestamp* plugin and the *BepInEx.SplashScreen* patcher. Timestamp is left
  out (it only fetches and logs the time). The splash screen is kept by choice (0.2.1); it is the likely source of
  ~450 harmless `TypeLoadException` warnings (its lookup of the BepInEx 5 type `BepInEx.ThreadingHelper` scans all
  assemblies) and of an intermittent false "[Splash] … chainloader has crashed" message (the flood delays the log lines the
  splash window waits for) — the game still starts normally.
  Existing installs: right-click the BepInEx mod → Reinstall.
- **Splash screen settings** (`BepInEx/config/BepInEx.SplashScreen.cfg`): it shows only while the BepInEx console is
  off unless `OnlyNoConsole = false`. With its default `RenameExe = true` it runs
  `Nivalis Nights.SplashScreen.GUI.exe`, which is the name the extension deploys (0.2.2); setting `RenameExe = false`
  would make it rename the file back and Vortex would report an external change.
- **Installer order**: our mod installers run at 21–23, ahead of the 25 slot where some community extensions (e.g.
  Bannerlord's) mis-answer for other games and log "Buggy installer" errors.
- **Exit crash is the game's**: `0xc0000005` in `UnityPlayer.dll` on quit also happens without Vortex (Windows event
  log shows it on most exits since 2026-10-02).
- **Deployment method**: with the staging folder on another drive than the game, Vortex uses symlinks. Putting the
  staging folder on the game's drive enables hardlinks (no elevation needed).
- **Vortex bug (not this extension)**: when changing the staging folder, an "External Changes" dialog raised by the
  purge step is hidden behind the "busy" overlay and Vortex appears stuck at "Purging previous deployment". It's safe
  to force-close at that point (nothing is purged or moved before the dialog). Workaround: deploy normally first so
  pending external changes are resolved, then move the staging folder.
- **Empty-folder cleanup** (`requiresCleanup`, 0.2.4): Vortex removes empty folders it created only after a deploy that
  removed files, or on purge — not on every deploy.
- `BepInEx.cfg` is deployed from the pack mod; BepInEx rewrites it through the link into the staging folder on first run.
  The extension's default sets `[Logging.Console] Enabled = false` (same as the pack).

## License

[EUPL-1.2](LICENSE) © 2026 Sebastian Maute. Third-party material (game art, the BepInEx pack downloaded at runtime,
type definitions) is listed in [NOTICE.md](NOTICE.md).

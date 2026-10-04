# Vortex support for Nivalis Nights

A [Vortex](https://www.nexusmods.com/about/vortex/) game extension for
[Nivalis Nights](https://store.steampowered.com/app/1488490/) ([Nexus Mods](https://www.nexusmods.com/nivalisnights)).
Built on the research in [vortex-extension-groundwork](https://github.com/sebastianmaute/vortex-extension-groundwork).

## What it does

- **Discovers the game** on Steam (app `1488490`). Epic is announced for later — add its id to `queryArgs` when known.
- **Installs BepInEx 6 automatically**: registers the game with Vortex's bundled BepInEx extension and points it at the
  community [BepInEx IL2CPP Pack](https://www.nexusmods.com/nivalisnights/mods/25) (file 48, BepInEx `6.0.0-be.788`).
  Vortex's default GitHub download would pick a `6.0.0-pre` release, which the community's IL2CPP plugins don't target.
- **Installs mods correctly** whatever the archive layout:

| Archive layout | Example | Installer | Deploys to |
|---|---|---|---|
| BepInEx pack (`winhttp.dll`, `BepInEx/core`, `dotnet/`) | Nexus #25 | modtype-bepinex injector (prio 10) | game root |
| `plugins/` / `config/` / `patchers/` at root | — | modtype-bepinex root (prio 10) | `BepInEx/` |
| FOMOD | — | Vortex FOMOD (prio 10/20) | game root |
| **`BepInEx/...`** relative to game root (the common case) | Trainer, ModKit, Ambience | `nivalisnights-bepinex-anchored` (26) | `BepInEx/` |
| Bare DLL(s), optionally in a mod folder | — | `nivalisnights-loose-plugin` (27) | `BepInEx/plugins/` |
| MelonLoader build (`Mods/*.dll`, `MelonLoader/`) | Trainer's ML file | `nivalisnights-melonloader` (25) | **refused** with a message to get the BepInEx file |
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

> ⚠️ The game folder already contains a manually installed BepInEx and plugins. Back up
> `E:\SteamLibrary\steamapps\common\Nivalis Nights\BepInEx` (and `winhttp.dll`, `doorstop_config.ini`, `dotnet\`)
> before letting Vortex manage the game; Vortex will meet existing files when it deploys.

1. `npm run deploy:dev`, restart Vortex; Extensions tab shows "Game: Nivalis Nights" without errors.
2. Games → Nivalis Nights is discovered via Steam → Manage. Staging folder must be on drive `E:` for hardlinks.
3. BepInEx pack is downloaded/installed as "Bepis Injector Extensible"; enable + deploy → `winhttp.dll`,
   `BepInEx/core`, `dotnet/` in the game root.
4. Install the three sample archives (Trainer, ModKit, Ambience) → deployed under `BepInEx/plugins/...`, no doubled paths.
5. Install the Trainer's MelonLoader file → refused with the explanatory message.
6. Launch the game from Vortex → `BepInEx/LogOutput.log` shows the plugins loading.
7. Before release (per Nexus review): install the top ~10 mods, test a clean install, test a collection.

## Status

`0.1.0` — first implementation; unit-tested, smoke-tested against a mocked Vortex API, not yet tested in Vortex.

# Nexus Mods upload — field by field

Upload at https://www.nexusmods.com/site (Modding Tools → Upload). Per the Vortex team's packaging rules: one file
under **Main Files**, version identical to `info.json`, semver, correct category.

| Field | Value |
|---|---|
| Game | Modding Tools (site) — *not* the Nivalis Nights section |
| Mod name | `Nivalis Nights Vortex Extension` (common convention; Vortex itself shows the `info.json` name "Nivalis Nights") |
| Category | The Vortex game-extension category the form offers (sources disagree: "Vortex > Extensions" vs "Vortex > User Extensions") |
| Version | `0.3.0` |
| Language | English |
| Summary | `Adds Nivalis Nights to Vortex: finds the game on Steam, installs BepInEx 6 (IL2CPP) automatically and installs BepInEx mods to the right place whatever the archive layout.` |
| Description | contents of [`description.bbcode`](description.bbcode) |
| Primary image | [`assets/nexus/header-640x360.jpg`](../../assets/nexus/header-640x360.jpg) (16:9, no text) |
| Adult content | No |
| Requirements | None (Vortex is implied; BepInEx is downloaded automatically) — optionally list *BepInEx IL2CPP Pack for Nivalis Nights* (nivalisnights #25) as "downloaded automatically by the extension" |
| Permissions / license | Custom: "Licensed under the EUPL-1.2 — you may use, modify and redistribute under its terms." Allow modification and conversion; upload permission: yes, under EUPL-1.2 |
| Source | link to the GitHub repository *(only if it is made public)* |

## Main file

| Field | Value |
|---|---|
| File | `release/game-nivalisnights-0.3.0.zip` |
| File name | `Nivalis Nights Vortex Extension` |
| Version | `0.3.0` |
| Category | Main Files |
| Description | `Vortex extension for Nivalis Nights 0.3.0 — first public release.` |

## Changelog (Nexus "Logs" tab)

```
0.3.0 — First public release
- Steam discovery; BepInEx 6 IL2CPP installed automatically from the Nivalis Nights BepInEx pack (#25), splash screen kept
- Installers for BepInEx/-relative archives (incl. wrapped), bare plugin DLLs, config files; MelonLoader builds refused with a hint
- Readme/license files never land in shared folders; empty folders cleaned up
- Tested with Vortex 2.7.2 on a clean game install with 23 popular mods
```

## After uploading

Submit the review request — see [`review-submission.md`](review-submission.md). The file stays under moderation until
the Vortex team approves it and adds it to the extension manifest.

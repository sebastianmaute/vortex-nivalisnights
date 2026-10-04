// SPDX-License-Identifier: EUPL-1.2
import * as path from "path";

import { fs } from "@nexusmods/vortex-api";
import type { types } from "@nexusmods/vortex-api";

import {
  BEPINEX_PACK,
  EXECUTABLE,
  GAME_ID,
  GAME_NAME,
  PRIORITY,
  STEAMAPP_ID,
} from "./common";
import {
  installBepInExAnchored,
  installBepInExPack,
  installLoosePlugin,
  installMelonLoader,
  testBepInExAnchored,
  testBepInExPack,
  testLoosePlugin,
  testMelonLoader,
} from "./installers";

/** Folders the BepInEx mod types deploy into — Vortex does not create them on its own. */
const BEPINEX_DIRS = [
  path.join("BepInEx", "plugins"),
  path.join("BepInEx", "config"),
  path.join("BepInEx", "patchers"),
];

async function setup(api: types.IExtensionApi, discovery: types.IDiscoveryResult): Promise<void> {
  if (discovery?.path === undefined) {
    throw new Error("Nivalis Nights game path is unknown");
  }
  try {
    for (const dir of BEPINEX_DIRS) {
      await fs.ensureDirWritableAsync(path.join(discovery.path, dir));
    }
  } catch (err) {
    api.showErrorNotification?.("Failed to prepare Nivalis Nights for modding", err as Error);
    throw err;
  }
}

function registerWithBepInEx(context: types.IExtensionContext): void {
  const addGame = context.api.ext?.bepinexAddGame;
  if (addGame === undefined) {
    return; // requireExtension below makes this unreachable in practice
  }
  addGame({
    gameId: GAME_ID,
    autoDownloadBepInEx: true,
    architecture: "x64",
    unityBuild: "unityil2cpp",
    customPackDownloader: () =>
      Promise.resolve({
        gameId: GAME_ID,
        domainId: GAME_ID,
        modId: BEPINEX_PACK.modId,
        fileId: BEPINEX_PACK.fileId,
        version: BEPINEX_PACK.version,
        architecture: "x64",
        archiveName: BEPINEX_PACK.archiveName,
        allowAutoInstall: true,
      }),
  });
}

function main(context: types.IExtensionContext): boolean {
  context.requireExtension("modtype-bepinex");

  context.registerGame({
    id: GAME_ID,
    name: GAME_NAME,
    mergeMods: true,
    // Remove empty folders left behind by removed/moved mods (many mods ship their own plugin folder).
    // With the default directoryCleaning "tag", only folders Vortex created are removed.
    requiresCleanup: true,
    logo: "gameart.jpg",
    executable: () => EXECUTABLE,
    requiredFiles: [EXECUTABLE, "GameAssembly.dll"],
    // Default target for archives no installer claims: the game root, because Nivalis Nights mods
    // are conventionally packed relative to it (BepInEx/plugins/...).
    queryModPath: () => ".",
    queryArgs: { steam: [{ id: STEAMAPP_ID }] },
    setup: (discovery) => setup(context.api, discovery),
    environment: { SteamAPPId: STEAMAPP_ID },
    details: {
      steamAppId: +STEAMAPP_ID,
      nexusPageId: GAME_ID,
    },
  });

  context.registerInstaller(`${GAME_ID}-bepinex-pack`, PRIORITY.bepinexPack, testBepInExPack, installBepInExPack);
  context.registerInstaller(`${GAME_ID}-melonloader`, PRIORITY.melonLoader, testMelonLoader, installMelonLoader);
  context.registerInstaller(`${GAME_ID}-bepinex-anchored`, PRIORITY.bepinexAnchored, testBepInExAnchored, installBepInExAnchored);
  context.registerInstaller(`${GAME_ID}-loose-plugin`, PRIORITY.loosePlugin, testLoosePlugin, installLoosePlugin);

  context.once(() => registerWithBepInEx(context));

  return true;
}

export default main;

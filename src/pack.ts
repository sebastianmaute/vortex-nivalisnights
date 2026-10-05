// SPDX-License-Identifier: EUPL-1.2
import * as https from "https";

import { BEPINEX_PACK, NEXUS_GAME_ID } from "./common";

/** The pack file Vortex should download: the newest MAIN file of the pack's Nexus page. */
export interface IPackFile {
  fileId: number;
  version: string;
  archiveName: string;
}

/** Posts a JSON body and resolves with the parsed JSON response. Injected so tests run offline. */
export type PostJson = (url: string, body: unknown) => Promise<unknown>;

interface IModFile {
  fileId: number;
  name: string;
  version: string;
  category: string;
  date: number;
}

const GRAPHQL_URL = "https://api.nexusmods.com/v2/graphql";
const TIMEOUT_MS = 10000;
const QUERY = "query($modId: ID!, $gameId: ID!) { modFiles(modId: $modId, gameId: $gameId) { fileId name version category date } }";

/** Fallback when Nexus can't be asked (offline, API change): the newest file known at release time. */
export const FALLBACK_PACK: IPackFile = {
  fileId: BEPINEX_PACK.fallbackFileId,
  version: BEPINEX_PACK.fallbackVersion,
  archiveName: `${BEPINEX_PACK.fallbackName}.zip`,
};

/** Picks the newest MAIN file; archived and old versions are ignored. */
export function newestMainFile(files: readonly IModFile[]): IPackFile | undefined {
  const main = files
    .filter((f) => f.category === "MAIN" && Number.isInteger(f.fileId))
    .sort((a, b) => b.date - a.date || b.fileId - a.fileId);
  if (main.length === 0) {
    return undefined;
  }
  const { fileId, name, version } = main[0];
  return { fileId, version, archiveName: `${name}.zip` };
}

/**
 * Asks the public Nexus Mods API for the pack's current MAIN file, so a new pack release is used
 * without an extension update. Never rejects: any failure returns FALLBACK_PACK and reports why.
 */
export async function resolvePackFile(
  post: PostJson = postJson,
  onFallback: (reason: string) => void = () => undefined,
): Promise<IPackFile> {
  try {
    const res = (await post(GRAPHQL_URL, {
      query: QUERY,
      variables: { modId: String(BEPINEX_PACK.modId), gameId: String(NEXUS_GAME_ID) },
    })) as { data?: { modFiles?: IModFile[] }; errors?: unknown };
    const files = res?.data?.modFiles;
    if (!Array.isArray(files)) {
      onFallback(`unexpected API response: ${JSON.stringify(res?.errors ?? res).slice(0, 300)}`);
      return FALLBACK_PACK;
    }
    const newest = newestMainFile(files);
    if (newest === undefined) {
      onFallback("the pack page has no MAIN file");
      return FALLBACK_PACK;
    }
    return newest;
  } catch (err) {
    onFallback(err instanceof Error ? err.message : String(err));
    return FALLBACK_PACK;
  }
}

function postJson(url: string, body: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          "User-Agent": "Vortex game-nivalisnights",
        },
        timeout: TIMEOUT_MS,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          if ((res.statusCode ?? 0) >= 400) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          try {
            resolve(JSON.parse(text));
          } catch {
            reject(new Error("response is not JSON"));
          }
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error("request timed out")));
    req.on("error", reject);
    req.end(payload);
  });
}

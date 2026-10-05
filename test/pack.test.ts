// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from "vitest";

import { BEPINEX_PACK, NEXUS_GAME_ID } from "../src/common";
import { FALLBACK_PACK, newestMainFile, resolvePackFile } from "../src/pack";

// Shape of the real modFiles answer for mods/25 on 2026-10-05.
const FILES = [
  { fileId: 48, name: "BepInEx IL2CPP Pack For Nivalis Nights v1.0.0", version: "1.0.0", category: "ARCHIVED", date: 1790892477 },
  { fileId: 182, name: "BepInEx IL2CPP Pack for Nivalis Nights v1.0.1", version: "1.0.1", category: "MAIN", date: 1791148337 },
];

describe("newestMainFile", () => {
  it("picks the MAIN file and ignores archived ones", () => {
    expect(newestMainFile(FILES)).toEqual({
      fileId: 182,
      version: "1.0.1",
      archiveName: "BepInEx IL2CPP Pack for Nivalis Nights v1.0.1.zip",
    });
  });

  it("picks the newest of several MAIN files", () => {
    const files = [...FILES, { fileId: 300, name: "Pack v1.1.0", version: "1.1.0", category: "MAIN", date: 1795000000 }];
    expect(newestMainFile(files)?.fileId).toBe(300);
  });

  it("returns undefined without a MAIN file", () => {
    expect(newestMainFile(FILES.filter((f) => f.category !== "MAIN"))).toBeUndefined();
  });
});

describe("resolvePackFile", () => {
  it("asks the API for mod 25 of game 10401", async () => {
    let sent: unknown;
    await resolvePackFile(async (_url, body) => {
      sent = body;
      return { data: { modFiles: FILES } };
    });
    expect(sent).toMatchObject({ variables: { modId: String(BEPINEX_PACK.modId), gameId: String(NEXUS_GAME_ID) } });
  });

  it("returns the newest MAIN file", async () => {
    const pack = await resolvePackFile(async () => ({ data: { modFiles: FILES } }));
    expect(pack.fileId).toBe(182);
  });

  it.each([
    ["a network error", async () => Promise.reject(new Error("offline"))],
    ["a GraphQL error", async () => ({ errors: [{ message: "boom" }] })],
    ["no MAIN file", async () => ({ data: { modFiles: [FILES[0]] } })],
    ["garbage", async () => "not json"],
  ])("falls back to the built-in file on %s", async (_label, post) => {
    const reasons: string[] = [];
    const pack = await resolvePackFile(post, (r) => reasons.push(r));
    expect(pack).toEqual(FALLBACK_PACK);
    expect(reasons).toHaveLength(1);
  });
});

// Live check against Nexus: run with NEXUS_LIVE=1 to confirm the query still works.
describe.runIf(process.env.NEXUS_LIVE === "1")("live Nexus API", () => {
  it("resolves the current pack without falling back", async () => {
    const reasons: string[] = [];
    const pack = await resolvePackFile(undefined, (r) => reasons.push(r));
    expect(reasons).toEqual([]);
    expect(pack.fileId).toBeGreaterThan(0);
    console.log("live pack:", pack);
  });
});

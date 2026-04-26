import { afterEach, describe, expect, it, vi } from "vitest";
import { OneClickDzClient } from "../src/server/services/oneclickdz";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("OneClickDzClient", () => {
  it("sends authorization header", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => []
    } as Response);

    const client = new OneClickDzClient("https://api.oneclickdz.com", "secret_key");
    await client.listCatalog();

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.oneclickdz.com/catalog",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer secret_key"
        })
      })
    );
  });

  it("throws when response status is not ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500
    } as Response);

    const client = new OneClickDzClient("https://api.oneclickdz.com", "secret_key");

    await expect(client.listCatalog()).rejects.toThrow("status 500");
  });
});

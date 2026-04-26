import { describe, expect, it } from "vitest";
import { parseEnv } from "../src/server/env";

describe("parseEnv", () => {
  it("accepts valid environment variables", () => {
    const env = parseEnv({
      NODE_ENV: "development",
      ONECLICKDZ_API_KEY: "secret",
      ONECLICKDZ_BASE_URL: "https://docs.oneclickdz.com",
      DATABASE_URL: "postgres://localhost/db"
    });

    expect(env.ONECLICKDZ_API_KEY).toBe("secret");
  });

  it("throws when API key is missing", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "development",
        ONECLICKDZ_BASE_URL: "https://docs.oneclickdz.com",
        DATABASE_URL: "postgres://localhost/db"
      })
    ).toThrow();
  });
});

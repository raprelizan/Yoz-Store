import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  ONECLICKDZ_API_KEY: z.string().min(1),
  ONECLICKDZ_BASE_URL: z.string().url().default("https://api.oneclickdz.com"),
  DATABASE_URL: z.string().min(1),
  OWNER_NOTIFICATION_EMAIL: z.string().email().optional()
});

export type AppEnv = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): AppEnv {
  return envSchema.parse(source);
}

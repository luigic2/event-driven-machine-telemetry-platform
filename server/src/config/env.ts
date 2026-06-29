import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3333),
  //   DATABASE_URL: z.url(),
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error", "fatal", "silent", "trace"])
    .default("info"),
});

const _env = envSchema.safeParse(process.env);
if (!_env.success) {
  console.error("Invalid environment variables! :", z.treeifyError(_env.error));
  throw new Error("Invalid environment variables!");
}

export type Env = z.infer<typeof envSchema>;
export const env = _env.data;

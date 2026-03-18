import { z } from 'zod';

type ApiEnvOptions = {
  defaultDataPath: string;
};

export const apiEnvSchema = z.object({
  API_PORT: z.coerce.number().int().positive().default(3001),
  OPSLEDGER_DATA_PATH: z.string().min(1),
  DATABASE_URL: z.string().url().optional(),
});

export const webEnvSchema = z.object({
  VITE_API_URL: z.string().url(),
});

export function parseApiEnv(
  env: Record<string, string | undefined>,
  options: ApiEnvOptions,
) {
  return apiEnvSchema.parse({
    API_PORT: env.API_PORT,
    OPSLEDGER_DATA_PATH: env.OPSLEDGER_DATA_PATH ?? options.defaultDataPath,
    DATABASE_URL: env.DATABASE_URL,
  });
}

export function parseWebEnv(env: Record<string, string | undefined>) {
  return webEnvSchema.parse({
    VITE_API_URL: env.VITE_API_URL ?? 'http://localhost:3001',
  });
}

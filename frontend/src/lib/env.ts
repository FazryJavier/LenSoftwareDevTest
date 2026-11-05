import { z } from 'zod';

const envSchema = z.object({
  VITE_MAP_STYLE_URL: z.url({ protocol: /^https?$/ }),
});

export type AppEnv = z.infer<typeof envSchema>;

export function readEnv(raw: unknown): AppEnv {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const names = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid environment variables: ${names}`);
  }
  return result.data;
}

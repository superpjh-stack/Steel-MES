import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL:    z.string().url('DATABASE_URL must be a valid URL'),
  NEXTAUTH_URL:    z.string().url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NODE_ENV:        z.enum(['development', 'production', 'test']).default('development'),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    console.error('❌ Environment validation failed:');
    Object.entries(errors).forEach(([key, messages]) => {
      console.error(`  ${key}: ${messages?.join(', ')}`);
    });
    // In production, crash fast. In development, warn.
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
  return result.data ?? (process.env as unknown as z.infer<typeof envSchema>);
}

export const env = validateEnv();

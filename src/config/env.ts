import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  SOURCE_DATABASE_URL: z.string().url(),
  TARGET_DATABASE_URL: z.string().url(),
  BACKUP_RETENTION_DAYS: z.string().transform(Number).default('7'),
  BACKUP_SCHEDULE: z.string().default('*/30 * * * *'),
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parseEnvVars = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => err.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
};

export const env = parseEnvVars(); 
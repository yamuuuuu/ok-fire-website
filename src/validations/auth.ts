import { z } from 'zod';
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(1).max(128),
}).strict();
export const seedSchema = z.object({
  SEED_ADMIN_NAME: z.string().trim().min(1).max(50),
  SEED_ADMIN_EMAIL: z.string().trim().toLowerCase().email().max(255),
  SEED_ADMIN_PASSWORD: z.string().min(10).max(128),
});

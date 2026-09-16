import type { AdminRole } from '@/generated/prisma/client';
export function hasRole(actual: AdminRole, required: AdminRole) { return actual === required; }

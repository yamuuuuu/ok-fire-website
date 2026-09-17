import 'server-only';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from './db';
import { getEnv } from './env';
import { ApiError } from './http';
import { hasRole } from './authorization';
import type { AdminRole } from '@/generated/prisma/client';
export const SESSION_COOKIE = '__Host-okfire_session';
export const SESSION_SECONDS = 60 * 60 * 8;
export const MFA_COOKIE='__Host-okfire_mfa'; export const MFA_SECONDS=300;
export const sessionCookieOptions = { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/' };
export function tokenHash(token: string) { return createHash('sha256').update(token).digest('hex'); }
export function signMfa(adminId:string){const payload=Buffer.from(JSON.stringify({adminId,expiresAt:Date.now()+MFA_SECONDS*1000})).toString('base64url');const signature=createHmac('sha256',getEnv().AUTH_SECRET).update(payload).digest('base64url');return `${payload}.${signature}`;}
export function verifyMfa(value?:string){try{if(!value)return null;const [payload,signature]=value.split('.');const expected=createHmac('sha256',getEnv().AUTH_SECRET).update(payload).digest('base64url');if(!signature||!timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return null;const data=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));return typeof data.adminId==='string'&&typeof data.expiresAt==='number'&&data.expiresAt>Date.now()?data.adminId:null;}catch{return null;}}
export function newSession() {
  const token = randomBytes(32).toString('hex');
  return { token, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000) };
}
export async function currentAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await db().adminSession.findFirst({ where: { tokenHash: tokenHash(token), expiresAt: { gt: new Date() } }, select: {
    expiresAt: true, admin: { select: { id: true, name: true, email: true, role: true, status: true, deletedAt: true } },
  } });
  if (!session || session.expiresAt <= new Date() || session.admin.status !== 'ACTIVE' || session.admin.deletedAt) return null;
  const { id, name, email, role } = session.admin;
  return { id: id.toString(), name, email, role };
}
export async function requireAdmin(role?: AdminRole) {
  const admin = await currentAdmin();
  if (!admin) throw new ApiError(401, 'UNAUTHORIZED', '관리자 로그인이 필요합니다.');
  if (role && !hasRole(admin.role, role)) throw new ApiError(403, 'FORBIDDEN', '접근 권한이 없습니다.');
  return admin;
}

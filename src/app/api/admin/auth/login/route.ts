import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { ApiError, failure, readJson, requireSameOrigin, success } from '@/lib/http';
import { DUMMY_PASSWORD_HASH, verifyPassword } from '@/lib/password';
import { consumeLoginLimit } from '@/lib/rate-limit';
import { MFA_COOKIE, MFA_SECONDS, newSession, SESSION_COOKIE, SESSION_SECONDS, sessionCookieOptions, signMfa, tokenHash } from '@/lib/session';
import { loginSchema } from '@/validations/auth';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const parsed = loginSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new ApiError(422, 'VALIDATION_ERROR', '이메일과 비밀번호를 확인해주세요.');
    const { email, password } = parsed.data;
    await consumeLoginLimit(email, request);
    const admin = await db().admin.findUnique({ where: { email } });
    const valid = await verifyPassword(password, admin?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!admin || !valid || admin.deletedAt || admin.status !== 'ACTIVE') {
      await db().adminActivityLog.create({ data: { actionType: 'LOGIN_FAILED', adminId: admin?.id } });
      throw new ApiError(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호를 확인해주세요.');
    }
    if (admin.totpSecret && admin.totpEnabledAt) { const response=success({requiresTotp:true});response.cookies.set(MFA_COOKIE,signMfa(admin.id.toString()),{...sessionCookieOptions,maxAge:MFA_SECONDS});return response; }
    const session = newSession();
    const previous = (await cookies()).get(SESSION_COOKIE)?.value;
    await db().$transaction(async tx => {
      // Recheck and lock the account to serialize login against deactivation.
      const active = await tx.$queryRaw<{ id: bigint }[]>`SELECT id FROM admins WHERE id = ${admin.id} AND status = 'ACTIVE' AND deleted_at IS NULL AND password_hash = ${admin.passwordHash} FOR UPDATE`;
      if (!active.length) throw new ApiError(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호를 확인해주세요.');
      if (previous) await tx.adminSession.deleteMany({ where: { tokenHash: tokenHash(previous) } });
      await tx.adminSession.deleteMany({ where: { adminId: admin.id, expiresAt: { lte: new Date() } } });
      await tx.adminSession.create({ data: { adminId: admin.id, tokenHash: session.tokenHash, expiresAt: session.expiresAt } });
      await tx.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
      await tx.adminActivityLog.create({ data: { adminId: admin.id, actionType: 'LOGIN', targetType: 'ADMIN', targetId: admin.id } });
    });
    const response = success({ admin: { id: admin.id.toString(), name: admin.name, email: admin.email, role: admin.role } });
    response.cookies.set(SESSION_COOKIE, session.token, { ...sessionCookieOptions, maxAge: SESSION_SECONDS, expires: session.expiresAt });
    return response;
  } catch (error) { return failure(error); }
}

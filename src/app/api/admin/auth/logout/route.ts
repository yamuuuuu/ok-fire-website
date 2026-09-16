import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { failure, requireSameOrigin, success } from '@/lib/http';
import { SESSION_COOKIE, sessionCookieOptions, tokenHash } from '@/lib/session';
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (token && /^[a-f0-9]{64}$/.test(token)) {
      await db().$transaction(async tx => {
        const session = await tx.adminSession.findUnique({ where: { tokenHash: tokenHash(token) } });
        if (session) {
          await tx.adminSession.deleteMany({ where: { id: session.id } });
          await tx.adminActivityLog.create({ data: { adminId: session.adminId, actionType: 'LOGOUT' } });
        }
      });
    }
    const response = success({ loggedOut: true });
    response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions, maxAge: 0, expires: new Date(0) });
    return response;
  } catch (error) { return failure(error); }
}

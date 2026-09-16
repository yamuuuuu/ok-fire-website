import { NextRequest, NextResponse } from 'next/server';
// This is only an early redirect. Layouts and every API handler verify the DB session.
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/admin/login') return NextResponse.next();
  if (!/^[a-f0-9]{64}$/.test(request.cookies.get('__Host-okfire_session')?.value ?? '')) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ['/admin/:path*'] };

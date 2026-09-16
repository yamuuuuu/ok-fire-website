import { NextRequest, NextResponse } from 'next/server';
// This is only an early redirect. Layouts and every API handler verify the DB session.
export function proxy(request: NextRequest) {
  const canonicalHost = new URL(process.env.APP_ORIGIN ?? request.url).host;
  if (request.headers.get('host') === `www.${canonicalHost}`) {
    const destination = new URL(request.url);
    destination.protocol = 'https:';
    destination.host = canonicalHost;
    return NextResponse.redirect(destination, 308);
  }
  if (!request.nextUrl.pathname.startsWith('/admin')) return NextResponse.next();
  if (request.nextUrl.pathname === '/admin/login') return NextResponse.next();
  if (!/^[a-f0-9]{64}$/.test(request.cookies.get('__Host-okfire_session')?.value ?? '')) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

// Paths that don't need a session
const PUBLIC = ['/login', '/register', '/customer', '/payment', '/api/auth', '/api/customer', '/api/payment/callback', '/api/setup'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.redirect(new URL('/login', req.url));

  const user = await verifyToken(token);
  if (!user) {
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  // Pending/rejected vendors
  if (user.status === 'pending' && !pathname.startsWith('/pending')) {
    return NextResponse.redirect(new URL('/pending', req.url));
  }
  if (user.status === 'rejected') {
    const res = NextResponse.redirect(new URL('/login?reason=rejected', req.url));
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  // Vendor trying to access admin area
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (user.role !== 'admin') return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const OBRAFLUX_DOMAIN = process.env.OBRAFLUX_DOMAIN || 'obraflux.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function middleware(request: NextRequest) {
  const { hostname, pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Skip static files, api routes, and _next
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') && !pathname.endsWith('/')
  ) {
    return response;
  }

  // Resolve tenant from subdomain or custom domain
  let tenantSlug: string | null = null;
  let tenantId: string | null = null;
  let brandingJson: string | null = null;

  try {
    // Try subdomain: e.g. acme.obraflux.com
    if (hostname.endsWith(`.${OBRAFLUX_DOMAIN}`)) {
      tenantSlug = hostname.replace(`.${OBRAFLUX_DOMAIN}`, '');
    } else if (hostname !== OBRAFLUX_DOMAIN && hostname !== 'localhost' && !hostname.startsWith('localhost:')) {
      // Custom domain
      tenantSlug = hostname;
    }

    if (tenantSlug) {
      const res = await fetch(`${API_URL}/v1/tenants/resolve?domain=${tenantSlug}`, { next: { revalidate: 3600 } });
      if (res.ok) {
        const tenant = await res.json();
        const data = tenant.data ?? tenant;
        tenantId = data.id;
        brandingJson = JSON.stringify(data.branding);
      }
    }
  } catch {
    // Non-blocking: if tenant resolution fails, continue without branding
  }

  if (tenantId) {
    response.headers.set('x-tenant-id', tenantId);
  }
  if (tenantSlug) {
    response.headers.set('x-tenant-slug', tenantSlug);
  }
  if (brandingJson) {
    // Truncate to avoid header size limits — full branding loaded client-side
    response.headers.set('x-branding', brandingJson.slice(0, 2048));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import { QueryProvider } from '@/providers/QueryProvider';
import { TenantProvider } from '@/providers/TenantProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import type { TenantBranding } from '@obraflux/shared';

export const metadata: Metadata = {
  title: 'ObraFlux',
  description: 'Plataforma de gestão de obras',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = headers();
  const tenantId = headersList.get('x-tenant-id') ?? undefined;
  const tenantSlug = headersList.get('x-tenant-slug') ?? undefined;

  let branding: TenantBranding | undefined;
  const brandingRaw = headersList.get('x-branding');
  if (brandingRaw) {
    try { branding = JSON.parse(brandingRaw); } catch { /* ignore */ }
  }

  // Reject values containing CSS breakout chars (semicolons, braces, angle brackets)
  const safeCss = (value: string, fallback: string) =>
    /^[^;{}<>]+$/.test(value) ? value : fallback;

  const primaryColor = safeCss(branding?.primaryColor ?? '', '#2563EB');
  const secondaryColor = safeCss(branding?.secondaryColor ?? '', '#7C3AED');
  const accentColor = safeCss(branding?.accentColor ?? '', '#10B981');
  const fontFamily = safeCss(branding?.fontFamily ?? '', 'Inter');
  const borderRadius = safeCss(branding?.borderRadius ?? '', '8px');
  // Strip </style> to prevent escaping the style block
  const safeCustomCss = branding?.customCss?.replace(/<\/style\s*>/gi, '') ?? '';

  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href={`https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@400;500;600;700&display=swap`}
          rel="stylesheet"
        />
        {safeCustomCss && (
          <style dangerouslySetInnerHTML={{ __html: safeCustomCss }} />
        )}
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --brand-primary: ${primaryColor};
              --brand-secondary: ${secondaryColor};
              --brand-accent: ${accentColor};
              --font-sans: '${fontFamily}', system-ui, sans-serif;
              --radius: ${borderRadius};
            }
          `,
        }} />
      </head>
      <body>
        <QueryProvider>
          <TenantProvider initialTenantId={tenantId} initialSlug={tenantSlug} initialBranding={branding}>
            <AuthProvider>
              {children}
            </AuthProvider>
          </TenantProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

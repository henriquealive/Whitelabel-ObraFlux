export interface TenantBranding {
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  fontFamily: string;
  borderRadius: string;
  companyName?: string | null;
  tagline?: string | null;
  footerText?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  privacyPolicyUrl?: string | null;
  termsUrl?: string | null;
  customCss?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
}

export interface TenantPublic {
  id: string;
  name: string;
  slug: string;
  customDomain?: string | null;
  branding: TenantBranding | null;
}

export const DEFAULT_BRANDING: TenantBranding = {
  primaryColor: '#2563EB',
  secondaryColor: '#7C3AED',
  accentColor: '#10B981',
  backgroundColor: '#FFFFFF',
  fontFamily: 'Inter',
  borderRadius: '8px',
};

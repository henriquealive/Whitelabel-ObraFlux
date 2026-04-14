'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { TenantBranding, TenantPublic } from '@obraflux/shared';
import { DEFAULT_BRANDING } from '@obraflux/shared';
import { api } from '@/lib/api';

interface TenantContextValue {
  tenantId: string | undefined;
  slug: string | undefined;
  branding: TenantBranding;
  tenant: TenantPublic | null;
}

const TenantContext = createContext<TenantContextValue>({
  tenantId: undefined,
  slug: undefined,
  branding: DEFAULT_BRANDING,
  tenant: null,
});

export function TenantProvider({
  children,
  initialTenantId,
  initialSlug,
  initialBranding,
}: {
  children: React.ReactNode;
  initialTenantId?: string;
  initialSlug?: string;
  initialBranding?: TenantBranding;
}) {
  const [tenant, setTenant] = useState<TenantPublic | null>(null);
  const [branding, setBranding] = useState<TenantBranding>(initialBranding ?? DEFAULT_BRANDING);

  useEffect(() => {
    if (!initialTenantId && !initialSlug) return;
    const slug = initialSlug ?? '';
    api
      .get<{ data: TenantPublic }>(`/v1/tenants/resolve?domain=${slug}`)
      .then((res) => {
        const t = res.data.data ?? (res.data as unknown as TenantPublic);
        setTenant(t);
        if (t.branding) setBranding(t.branding);
      })
      .catch(() => {});
  }, [initialTenantId, initialSlug]);

  return (
    <TenantContext.Provider value={{ tenantId: initialTenantId, slug: initialSlug, branding, tenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext);

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTenant } from '@/providers/TenantProvider';
import { useAuthStore } from '@/store/authStore';
import { cn, initials } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: '⊞' },
  { label: 'Obras', href: '/projects', icon: '🏗️' },
  { label: 'Blog', href: '/blog', icon: '📝' },
  { label: 'Cupons', href: '/coupons', icon: '🏷️' },
  { label: 'Auditoria', href: '/audit', icon: '🔍', adminOnly: true },
];

const SETTINGS_ITEMS = [
  { label: 'Equipe', href: '/settings/team', icon: '👥' },
  { label: 'White Label', href: '/settings/white-label', icon: '🎨' },
  { label: 'Assinatura', href: '/settings/billing', icon: '💳' },
  { label: 'Segurança', href: '/settings/security', icon: '🔐' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { branding, tenant } = useTenant();
  const { user } = useAuthStore();

  const companyName = tenant?.branding?.companyName || branding?.companyName || 'ObraFlux';
  const primaryColor = branding?.primaryColor || '#2563EB';

  const navItems = NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN');

  return (
    <aside className="w-64 h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            {companyName.charAt(0)}
          </div>
          <span className="font-semibold text-slate-900 dark:text-white text-sm truncate">{companyName}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} active={pathname.startsWith(item.href)} />
        ))}

        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 mb-2">Configurações</p>
          {SETTINGS_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} active={pathname.startsWith(item.href)} />
          ))}
        </div>
      </nav>

      {/* User */}
      {user && (
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold shrink-0">
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function NavItem({ label, href, icon, active }: { label: string; href: string; icon: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        active
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
      )}
    >
      <span className="text-base">{icon}</span>
      {label}
    </Link>
  );
}

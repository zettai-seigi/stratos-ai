import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Search, Bell, Sparkles } from 'lucide-react';
import { ThemeToggle } from '../shared/ThemeToggle';

interface BreadcrumbItem {
  label: string;
  path: string;
}

const routeLabels: Record<string, string> = {
  '': 'Dashboards',
  'strategy': 'Strategy Hub',
  'portfolio': 'Initiative Portfolio',
  'execution': 'Project Execution',
  'insights': 'AI Insights Center',
  'export': 'Export Template',
  'import': 'Import Data',
  'resources': 'Resources',
  'settings': 'Settings',
};

export const Header: React.FC = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Build breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
  ];

  let currentPath = '';
  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`;
    const label = routeLabels[segment] || segment;
    breadcrumbs.push({ label, path: currentPath });
  });

  return (
    <header className="h-12 bg-[var(--cds-layer-01)] border-b border-[var(--cds-border-subtle-00)] px-4 flex items-center justify-between">
      {/* Breadcrumbs - Carbon style */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.path}>
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-[var(--cds-text-helper)]" />
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="text-[var(--cds-text-primary)]">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.path}
                className="text-[var(--cds-link-primary)] hover:text-[var(--cds-link-primary-hover)] hover:underline"
              >
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Right side actions */}
      <div className="flex items-center gap-1">
        {/* Carbon Search - simplified */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--cds-icon-secondary)]" />
          <input
            type="text"
            placeholder="Search..."
            className="w-56 h-8 pl-9 pr-3 bg-[var(--cds-field-01)] border-b border-[var(--cds-border-strong-01)] text-sm text-[var(--cds-text-primary)] placeholder:text-[var(--cds-text-placeholder)] focus:outline-none focus:border-b-2 focus:border-[var(--cds-focus)] transition-colors"
          />
        </div>

        {/* Carbon Ghost Button - AI Lens */}
        <button className="h-8 px-3 flex items-center gap-2 bg-transparent text-[var(--cds-link-primary)] hover:bg-[var(--cds-background-hover)] transition-colors text-sm">
          <Sparkles className="w-4 h-4" />
          <span>AI Lens</span>
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Carbon Icon Button - Notifications */}
        <button className="relative w-10 h-10 flex items-center justify-center text-[var(--cds-icon-secondary)] hover:bg-[var(--cds-background-hover)] transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--cds-support-error)] rounded-full"></span>
        </button>

        {/* User Avatar */}
        <button className="w-10 h-10 flex items-center justify-center hover:bg-[var(--cds-background-hover)] transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#8a3ffc] flex items-center justify-center">
            <span className="text-white text-sm font-medium">JD</span>
          </div>
        </button>
      </div>
    </header>
  );
};

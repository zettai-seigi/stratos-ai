import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Search, Bell, Sparkles } from 'lucide-react';
import { ThemeToggle } from '../shared/ThemeToggle';

interface HeaderProps {
  visible: boolean;
}

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

export const Header: React.FC<HeaderProps> = ({ visible }) => {
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
    <header
      className={`h-8 bg-[var(--cds-layer-01)] border-b border-[var(--cds-border-subtle-00)] px-3 flex items-center justify-between transition-all duration-200 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 absolute'
      }`}
    >
      {/* Breadcrumbs - Carbon style */}
      <nav className="flex items-center gap-1 text-xs">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.path}>
            {index > 0 && (
              <ChevronRight className="w-3 h-3 text-[var(--cds-text-helper)]" />
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
      <div className="flex items-center gap-0.5">
        {/* Carbon Search - simplified */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--cds-icon-secondary)]" />
          <input
            type="text"
            placeholder="Search..."
            className="w-40 h-6 pl-7 pr-2 bg-[var(--cds-field-01)] border-b border-[var(--cds-border-strong-01)] text-xs text-[var(--cds-text-primary)] placeholder:text-[var(--cds-text-placeholder)] focus:outline-none focus:border-b-2 focus:border-[var(--cds-focus)] transition-colors"
          />
        </div>

        {/* Carbon Ghost Button - AI Lens */}
        <button className="h-6 px-2 flex items-center gap-1 bg-transparent text-[var(--cds-link-primary)] hover:bg-[var(--cds-background-hover)] transition-colors text-xs">
          <Sparkles className="w-3 h-3" />
          <span>AI</span>
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Carbon Icon Button - Notifications */}
        <button className="relative w-6 h-6 flex items-center justify-center text-[var(--cds-icon-secondary)] hover:bg-[var(--cds-background-hover)] transition-colors">
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-[var(--cds-support-error)] rounded-full"></span>
        </button>

        {/* User Avatar */}
        <button className="w-6 h-6 flex items-center justify-center hover:bg-[var(--cds-background-hover)] transition-colors">
          <div className="w-5 h-5 rounded-full bg-[#8a3ffc] flex items-center justify-center">
            <span className="text-white text-[8px] font-medium">JD</span>
          </div>
        </button>
      </div>
    </header>
  );
};

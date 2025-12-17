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
    <header className="h-16 bg-surface border-b border-outline-variant px-6 flex items-center justify-between">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.path}>
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-outline" />
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="text-on-surface font-medium">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.path}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* M3 Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 pl-12 pr-4 py-2.5 bg-surface-container-highest rounded-full text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        {/* M3 AI Lens FAB-style button */}
        <button className="flex items-center gap-2 px-4 py-2.5 bg-tertiary-container text-on-tertiary-container rounded-full hover:shadow-md transition-all duration-200">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">AI Lens</span>
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* M3 Icon Button - Notifications */}
        <button className="relative p-2.5 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface"></span>
        </button>

        {/* M3 Avatar */}
        <div className="w-10 h-10 rounded-full bg-tertiary flex items-center justify-center cursor-pointer hover:shadow-md transition-shadow">
          <span className="text-on-tertiary text-sm font-medium">JD</span>
        </div>
      </div>
    </header>
  );
};

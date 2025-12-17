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
    <header className="h-16 bg-bg-secondary border-b border-border px-6 flex items-center justify-between">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.path}>
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-text-muted" />
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="text-text-primary font-medium">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.path}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 pl-10 pr-4 py-2 bg-bg-card border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue transition-colors"
          />
        </div>

        {/* AI Lens Toggle */}
        <button className="flex items-center gap-2 px-3 py-2 bg-accent-purple/20 text-accent-purple rounded-lg hover:bg-accent-purple/30 transition-colors">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">AI Lens</span>
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <button className="relative p-2 text-text-secondary hover:text-text-primary transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rag-red rounded-full"></span>
        </button>

        {/* Profile */}
        <div className="w-9 h-9 rounded-full bg-accent-purple flex items-center justify-center cursor-pointer">
          <span className="text-white text-sm font-medium">JD</span>
        </div>
      </div>
    </header>
  );
};

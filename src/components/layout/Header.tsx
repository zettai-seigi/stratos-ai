import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Search, Bell, Sparkles, Building2, ChevronDown } from 'lucide-react';
import { ThemeToggle } from '../shared/ThemeToggle';
import { useOrgContext } from '../../context/OrgContext';
import { useApp } from '../../context/AppContext';

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
  const { selectedOrgUnitId, setSelectedOrgUnitId } = useOrgContext();
  const { getOrgUnit, getChildOrgUnits, getOrgConfig, state } = useApp();
  const [orgDropdownOpen, setOrgDropdownOpen] = React.useState(false);
  const orgDropdownRef = React.useRef<HTMLDivElement>(null);

  const config = getOrgConfig();
  const orgUnits = state.orgUnits || [];
  const selectedUnit = selectedOrgUnitId ? getOrgUnit(selectedOrgUnitId) : null;
  // Get root corporation or first company for display
  const corporateEntities = state.corporateEntities || [];
  const rootEntity = corporateEntities.find((e) => e.entityType === 'corporation' && !e.parentEntityId);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target as Node)) {
        setOrgDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Get top-level org units (directorates without parent)
  const topLevelOrgUnits = orgUnits.filter((u) => !u.parentId && u.isActive);

  // Recursive org tree renderer for dropdown
  const renderOrgTree = (unit: typeof orgUnits[0], depth: number = 0): React.ReactNode => {
    if (!unit) return null;
    const children = getChildOrgUnits(unit.id);
    return (
      <React.Fragment key={unit.id}>
        <button
          onClick={() => {
            setSelectedOrgUnitId(unit.id);
            setOrgDropdownOpen(false);
          }}
          className={`w-full text-left px-2 py-1 text-xs hover:bg-[var(--cds-background-hover)] ${
            selectedOrgUnitId === unit.id ? 'bg-[var(--cds-background-active)] text-[var(--cds-link-primary)]' : ''
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {unit.name}
        </button>
        {children.map((child) => renderOrgTree(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <header
      className={`h-8 bg-[var(--cds-layer-01)] border-b border-[var(--cds-border-subtle-00)] px-3 flex items-center justify-between transition-all duration-200 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 absolute'
      }`}
    >
      {/* Left side: Org Selector + Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Org Selector - Compact */}
        {orgUnits.length > 0 && (
          <div className="relative" ref={orgDropdownRef}>
            <button
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-[var(--cds-text-secondary)] hover:bg-[var(--cds-background-hover)] transition-colors"
            >
              <Building2 className="w-3 h-3" />
              <span className="max-w-[120px] truncate">
                {selectedUnit ? selectedUnit.name : 'All Org'}
              </span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {orgDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--cds-layer-01)] border border-[var(--cds-border-subtle-00)] rounded shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedOrgUnitId(null);
                    setOrgDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1 text-xs hover:bg-[var(--cds-background-hover)] ${
                    !selectedOrgUnitId ? 'bg-[var(--cds-background-active)] text-[var(--cds-link-primary)]' : ''
                  }`}
                >
                  All Organizations
                </button>
                <div className="border-t border-[var(--cds-border-subtle-00)] my-1" />
                {topLevelOrgUnits.map((unit) => renderOrgTree(unit))}
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        {orgUnits.length > 0 && (
          <div className="h-4 w-px bg-[var(--cds-border-subtle-00)]" />
        )}

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
      </div>

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

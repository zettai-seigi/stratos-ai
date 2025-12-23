import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  Briefcase,
  FolderKanban,
  Lightbulb,
  Settings,
  User,
  Download,
  Upload,
  Pin,
  PinOff,
  HelpCircle,
} from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}

// Carbon UI Shell Side Nav Item - compact height
const NavItem: React.FC<NavItemProps> = ({ to, icon, label, collapsed }) => (
  <NavLink
    to={to}
    title={collapsed ? label : undefined}
    className={({ isActive }) =>
      `flex items-center h-7 transition-all duration-200 ${
        collapsed ? 'justify-center' : 'gap-2 px-2'
      } ${
        isActive
          ? 'bg-sidebar-active text-sidebar-text border-l-2 border-l-accent-blue'
          : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text border-l-2 border-l-transparent'
      }`
    }
  >
    <span className="flex-shrink-0">{icon}</span>
    {!collapsed && <span className="text-[11px] truncate">{label}</span>}
  </NavLink>
);

// Carbon Section Header - compact
const SectionHeader: React.FC<{ label: string; collapsed: boolean }> = ({ label, collapsed }) => {
  if (collapsed) {
    return <div className="mx-0.5 my-1 h-px bg-sidebar-border" />;
  }
  return (
    <div className="px-2 py-1 mt-1">
      <span className="text-[10px] font-semibold text-sidebar-text-muted uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
};

const COLLAPSED_WIDTH = 'w-8';
const EXPANDED_WIDTH = 'w-36';

interface SidebarProps {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ expanded, onExpandedChange }) => {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Sidebar shows expanded content if pinned OR hovered
  const showExpanded = pinned || hovered;

  // When unpinned, sidebar overlays content (absolute positioning)
  const isOverlay = !pinned && hovered;

  // Notify parent of pinned state (content only moves when pinned changes, not on hover)
  React.useEffect(() => {
    onExpandedChange(pinned);
  }, [pinned, onExpandedChange]);

  return (
    <>
      {/* Actual sidebar - fixed position */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`fixed top-0 left-0 h-screen bg-sidebar-bg flex flex-col transition-all duration-200 z-40 ${
          showExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH
        } ${isOverlay ? 'shadow-lg' : ''}`}
      >
        {/* Header with logo and toggle */}
        <div className={`h-8 flex items-center justify-between border-b border-sidebar-border ${showExpanded ? 'px-2' : 'px-1'}`}>
          <div className={`flex items-center overflow-hidden ${showExpanded ? 'gap-1.5' : 'justify-center w-full'}`}>
            <div className="w-5 h-5 bg-accent-blue flex items-center justify-center flex-shrink-0">
              <Target className="w-3 h-3 text-white" />
            </div>
            {showExpanded && (
              <span className="text-xs font-semibold text-sidebar-text whitespace-nowrap">
                Strat<span className="text-accent-blue">OS</span>
              </span>
            )}
          </div>

          {/* Toggle/Pin button inline with logo */}
          {showExpanded && (
            <button
              onClick={() => setPinned(!pinned)}
              className="p-0.5 text-sidebar-text-muted hover:text-sidebar-text hover:bg-sidebar-hover rounded transition-colors"
              title={pinned ? 'Unpin sidebar (auto-collapse)' : 'Pin sidebar (stay open)'}
            >
              {pinned ? (
                <Pin className="w-3 h-3" />
              ) : (
                <PinOff className="w-3 h-3" />
              )}
            </button>
          )}
        </div>

        {/* Carbon Side Nav */}
        <nav className="flex-1 py-1 overflow-y-auto">
          <NavItem
            to="/"
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Dashboards"
            collapsed={!showExpanded}
          />
          <NavItem
            to="/strategy"
            icon={<Target className="w-4 h-4" />}
            label="Strategy"
            collapsed={!showExpanded}
          />
          <NavItem
            to="/portfolio"
            icon={<Briefcase className="w-4 h-4" />}
            label="Portfolio"
            collapsed={!showExpanded}
          />
          <NavItem
            to="/execution"
            icon={<FolderKanban className="w-4 h-4" />}
            label="Execution"
            collapsed={!showExpanded}
          />
          <NavItem
            to="/insights"
            icon={<Lightbulb className="w-4 h-4" />}
            label="AI Insights"
            collapsed={!showExpanded}
          />

          {/* Divider */}
          <div className={`${!showExpanded ? 'mx-0.5' : 'mx-2'} my-1 h-px bg-sidebar-border`} />

          <SectionHeader label="Data" collapsed={!showExpanded} />
          <NavItem
            to="/export"
            icon={<Download className="w-4 h-4" />}
            label="Export"
            collapsed={!showExpanded}
          />
          <NavItem
            to="/import"
            icon={<Upload className="w-4 h-4" />}
            label="Import"
            collapsed={!showExpanded}
          />

          {/* Divider */}
          <div className={`${!showExpanded ? 'mx-0.5' : 'mx-2'} my-1 h-px bg-sidebar-border`} />

          <SectionHeader label="Manage" collapsed={!showExpanded} />
          <NavItem
            to="/resources"
            icon={<User className="w-4 h-4" />}
            label="Resources"
            collapsed={!showExpanded}
          />
          <NavItem
            to="/settings"
            icon={<Settings className="w-4 h-4" />}
            label="Settings"
            collapsed={!showExpanded}
          />
          <NavItem
            to="/help"
            icon={<HelpCircle className="w-4 h-4" />}
            label="Help"
            collapsed={!showExpanded}
          />
        </nav>

        {/* User Profile - Carbon style */}
        <div className="border-t border-sidebar-border">
          <div
            className={`flex items-center py-1 hover:bg-sidebar-hover cursor-pointer transition-colors ${
              !showExpanded ? 'justify-center' : 'gap-1.5 px-2'
            }`}
            title={!showExpanded ? 'Jane Doe - PMO Director' : undefined}
          >
            <div className="w-5 h-5 rounded-full bg-accent-purple flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[8px] font-medium">JD</span>
            </div>
            {showExpanded && (
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-sidebar-text truncate">Jane Doe</p>
                <p className="text-[8px] text-sidebar-text-muted truncate">PMO</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

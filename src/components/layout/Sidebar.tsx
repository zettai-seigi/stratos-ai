import React from 'react';
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
} from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

// M3 Navigation Drawer Item
const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200 ${
        isActive
          ? 'bg-primary-container text-on-primary-container font-medium'
          : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text'
      }`
    }
  >
    {icon}
    <span className="text-sm">{label}</span>
  </NavLink>
);

// M3 Section Header
const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <div className="px-4 py-3">
    <span className="text-xs font-medium text-sidebar-text-muted uppercase tracking-wider">
      {label}
    </span>
  </div>
);

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-72 min-h-screen bg-sidebar-bg flex flex-col">
      {/* Logo - M3 style with more padding */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Target className="w-6 h-6 text-on-primary" />
          </div>
          <div>
            <span className="text-xl font-semibold text-sidebar-text">
              Strat<span className="text-primary">OS</span>
            </span>
            <span className="text-sidebar-text-muted font-normal ml-1">AI</span>
          </div>
        </div>
      </div>

      {/* M3 Divider */}
      <div className="mx-4 h-px bg-sidebar-hover" />

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem
          to="/"
          icon={<LayoutDashboard className="w-5 h-5" />}
          label="Dashboards"
        />
        <NavItem
          to="/strategy"
          icon={<Target className="w-5 h-5" />}
          label="Strategy Hub"
        />
        <NavItem
          to="/portfolio"
          icon={<Briefcase className="w-5 h-5" />}
          label="Initiative Portfolio"
        />
        <NavItem
          to="/execution"
          icon={<FolderKanban className="w-5 h-5" />}
          label="Project Execution"
        />
        <NavItem
          to="/insights"
          icon={<Lightbulb className="w-5 h-5" />}
          label="AI Insights Center"
        />

        {/* M3 Divider */}
        <div className="!my-4 mx-1 h-px bg-sidebar-hover" />

        <SectionHeader label="Data" />
        <NavItem
          to="/export"
          icon={<Download className="w-5 h-5" />}
          label="Export Template"
        />
        <NavItem
          to="/import"
          icon={<Upload className="w-5 h-5" />}
          label="Import Data"
        />

        {/* M3 Divider */}
        <div className="!my-4 mx-1 h-px bg-sidebar-hover" />

        <SectionHeader label="Manage" />
        <NavItem
          to="/resources"
          icon={<User className="w-5 h-5" />}
          label="Resources"
        />
        <NavItem
          to="/settings"
          icon={<Settings className="w-5 h-5" />}
          label="Settings"
        />
      </nav>

      {/* User Profile - M3 style */}
      <div className="p-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-hover">
          <div className="w-10 h-10 rounded-full bg-tertiary flex items-center justify-center">
            <span className="text-on-tertiary font-medium text-sm">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-text truncate">Jane Doe</p>
            <p className="text-xs text-sidebar-text-muted truncate">PMO Director</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

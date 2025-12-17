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

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
        isActive
          ? 'bg-sidebar-active text-sidebar-text'
          : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text'
      }`
    }
  >
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </NavLink>
);

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 min-h-screen bg-sidebar-bg border-r border-sidebar-active flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-sidebar-active">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent-blue rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-sidebar-text">
            Strat<span className="text-accent-blue">OS</span>{' '}
            <span className="text-sidebar-text-muted font-normal">AI</span>
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
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

        <div className="pt-4 mt-4 border-t border-sidebar-active">
          <p className="px-4 py-2 text-xs font-semibold text-sidebar-text-muted uppercase tracking-wider">
            Data
          </p>
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
        </div>

        <div className="pt-4 mt-4 border-t border-sidebar-active">
          <p className="px-4 py-2 text-xs font-semibold text-sidebar-text-muted uppercase tracking-wider">
            Manage
          </p>
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
        </div>
      </nav>

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-sidebar-active">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-purple flex items-center justify-center">
            <span className="text-white font-medium">JD</span>
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

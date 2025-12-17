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

// Carbon UI Shell Side Nav Item - no rounded corners
const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 h-12 transition-colors duration-70 ${
        isActive
          ? 'bg-[#393939] text-white border-l-[3px] border-l-[#0f62fe]'
          : 'text-[#c6c6c6] hover:bg-[#353535] hover:text-white border-l-[3px] border-l-transparent'
      }`
    }
  >
    {icon}
    <span className="text-sm">{label}</span>
  </NavLink>
);

// Carbon Section Header
const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <div className="px-4 py-3 mt-4">
    <span className="text-xs font-semibold text-[#8d8d8d] uppercase tracking-wider">
      {label}
    </span>
  </div>
);

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 min-h-screen bg-[#161616] flex flex-col">
      {/* Carbon Header - Logo area */}
      <div className="h-12 px-4 flex items-center border-b border-[#393939]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0f62fe] flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <span className="text-base font-semibold text-white">
            Strat<span className="text-[#78a9ff]">OS</span>
            <span className="text-[#8d8d8d] font-normal ml-1">AI</span>
          </span>
        </div>
      </div>

      {/* Carbon Side Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
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

        {/* Divider */}
        <div className="mx-4 my-4 h-px bg-[#393939]" />

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

        {/* Divider */}
        <div className="mx-4 my-4 h-px bg-[#393939]" />

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

      {/* User Profile - Carbon style */}
      <div className="border-t border-[#393939]">
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#353535] cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#8a3ffc] flex items-center justify-center">
            <span className="text-white text-sm font-medium">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">Jane Doe</p>
            <p className="text-xs text-[#8d8d8d] truncate">PMO Director</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

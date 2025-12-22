import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  BookOpen,
  Target,
  FolderKanban,
  BarChart3,
  AlertTriangle,
  Sparkles,
  Users,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Layers,
  ArrowRight,
  Calculator,
  Settings,
  FileDown,
  FileUp,
} from 'lucide-react';

interface AccordionItemProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  icon,
  children,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-bg-card hover:bg-bg-hover transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-blue/10 rounded-lg text-accent-blue">
            {icon}
          </div>
          <span className="font-medium text-text-primary">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-text-muted" />
        ) : (
          <ChevronRight className="w-5 h-5 text-text-muted" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 py-4 bg-bg-primary border-t border-border">
          {children}
        </div>
      )}
    </div>
  );
};

export const HelpPage: React.FC = () => {
  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Help & Documentation</h1>
          <p className="text-text-secondary mt-1">Learn how to use StratOS AI effectively</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-bg-card rounded-lg border border-border">
          <HelpCircle className="w-5 h-5 text-accent-blue" />
          <span className="text-sm text-text-secondary">User Guide</span>
        </div>
      </div>

      {/* Quick Start */}
      <div className="bg-bg-card rounded-xl border border-border p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-accent-purple/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-accent-purple" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Welcome to StratOS AI</h2>
            <p className="text-text-secondary mt-1">
              StratOS AI is an AI-driven Integrated Strategy & Delivery Platform that connects strategic goals
              to operational execution through the "Golden Thread" - a hierarchical framework that links every
              task back to strategic objectives.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <Link
            to="/"
            className="flex items-center gap-3 p-3 bg-bg-hover rounded-lg hover:bg-bg-secondary transition-colors"
          >
            <Target className="w-6 h-6 text-accent-blue" />
            <div>
              <p className="text-sm font-medium text-text-primary">Dashboards</p>
              <p className="text-xs text-text-muted">Strategic overview</p>
            </div>
          </Link>
          <Link
            to="/strategy"
            className="flex items-center gap-3 p-3 bg-bg-hover rounded-lg hover:bg-bg-secondary transition-colors"
          >
            <Layers className="w-6 h-6 text-rag-green" />
            <div>
              <p className="text-sm font-medium text-text-primary">Strategy Hub</p>
              <p className="text-xs text-text-muted">KPIs & Pillars</p>
            </div>
          </Link>
          <Link
            to="/portfolio"
            className="flex items-center gap-3 p-3 bg-bg-hover rounded-lg hover:bg-bg-secondary transition-colors"
          >
            <BarChart3 className="w-6 h-6 text-accent-purple" />
            <div>
              <p className="text-sm font-medium text-text-primary">Portfolio</p>
              <p className="text-xs text-text-muted">Initiatives & Projects</p>
            </div>
          </Link>
          <Link
            to="/execution"
            className="flex items-center gap-3 p-3 bg-bg-hover rounded-lg hover:bg-bg-secondary transition-colors"
          >
            <FolderKanban className="w-6 h-6 text-accent-cyan" />
            <div>
              <p className="text-sm font-medium text-text-primary">Execution</p>
              <p className="text-xs text-text-muted">Tasks & Kanban</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Documentation Sections */}
      <div className="space-y-4">
        <AccordionItem
          title="The Golden Thread Hierarchy"
          icon={<Layers className="w-5 h-5" />}
        >
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              The Golden Thread is a strict 4-level hierarchy that ensures every piece of work can be traced
              back to strategic objectives:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-bg-hover rounded-lg">
                <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue font-bold">1</div>
                <div>
                  <p className="font-medium text-text-primary">Strategy Pillars (Balanced Scorecard)</p>
                  <p className="text-sm text-text-secondary">
                    The four perspectives: Financial, Customer, Internal Processes, and Learning & Growth.
                    These represent your organization's strategic focus areas.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-text-muted rotate-90" />
              </div>

              <div className="flex items-start gap-3 p-3 bg-bg-hover rounded-lg">
                <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center text-accent-purple font-bold">2</div>
                <div>
                  <p className="font-medium text-text-primary">Initiatives (Programs/Portfolios)</p>
                  <p className="text-sm text-text-secondary">
                    Major programs or portfolios linked to a single Strategy Pillar. Each initiative has
                    a budget, timeline, and owner.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-text-muted rotate-90" />
              </div>

              <div className="flex items-start gap-3 p-3 bg-bg-hover rounded-lg">
                <div className="w-8 h-8 rounded-full bg-accent-cyan/20 flex items-center justify-center text-accent-cyan font-bold">3</div>
                <div>
                  <p className="font-medium text-text-primary">Projects</p>
                  <p className="text-sm text-text-secondary">
                    Time-bound execution vehicles linked to a single Initiative. Projects have budgets,
                    timelines, and RAG status tracking.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-text-muted rotate-90" />
              </div>

              <div className="flex items-start gap-3 p-3 bg-bg-hover rounded-lg">
                <div className="w-8 h-8 rounded-full bg-rag-green/20 flex items-center justify-center text-rag-green font-bold">4</div>
                <div>
                  <p className="font-medium text-text-primary">Tasks</p>
                  <p className="text-sm text-text-secondary">
                    Granular work items linked to a single Project. Tasks are managed via Kanban board
                    with statuses: To Do, In Progress, Blocked, Done.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </AccordionItem>

        <AccordionItem
          title="RAG Status Explained"
          icon={<AlertTriangle className="w-5 h-5" />}
        >
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              RAG (Red, Amber, Green) status is used throughout the platform to indicate health and risk levels:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-rag-green/10 border border-rag-green/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-rag-green" />
                  <span className="font-medium text-rag-green">Green - On Track</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Everything is progressing as planned. No immediate action required.
                </p>
              </div>

              <div className="p-4 bg-rag-amber/10 border border-rag-amber/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-rag-amber" />
                  <span className="font-medium text-rag-amber">Amber - At Risk</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Some issues identified that may impact delivery. Monitor closely and take preventive action.
                </p>
              </div>

              <div className="p-4 bg-rag-red/10 border border-rag-red/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-rag-red" />
                  <span className="font-medium text-rag-red">Red - Critical</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Significant issues requiring immediate attention. Escalation and intervention needed.
                </p>
              </div>
            </div>
          </div>
        </AccordionItem>

        <AccordionItem
          title="Risk Score Calculation"
          icon={<Calculator className="w-5 h-5" />}
        >
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              The Risk Score (0-100) provides a comprehensive assessment of initiative health based on
              the project management "holy trinity" of <strong>Cost, Scope, and Time</strong>, plus
              resource and quality dimensions. A score of 0 means everything is on track.
            </p>

            {/* The Five Dimensions */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="p-3 bg-bg-hover rounded-lg text-center">
                <div className="text-lg font-bold text-accent-blue mb-1">⏱️</div>
                <p className="text-xs font-medium text-text-primary">Time</p>
                <p className="text-[10px] text-text-muted">25% weight</p>
              </div>
              <div className="p-3 bg-bg-hover rounded-lg text-center">
                <div className="text-lg font-bold text-accent-blue mb-1">💰</div>
                <p className="text-xs font-medium text-text-primary">Cost</p>
                <p className="text-[10px] text-text-muted">25% weight</p>
              </div>
              <div className="p-3 bg-bg-hover rounded-lg text-center">
                <div className="text-lg font-bold text-accent-blue mb-1">📋</div>
                <p className="text-xs font-medium text-text-primary">Scope</p>
                <p className="text-[10px] text-text-muted">20% weight</p>
              </div>
              <div className="p-3 bg-bg-hover rounded-lg text-center">
                <div className="text-lg font-bold text-accent-blue mb-1">👥</div>
                <p className="text-xs font-medium text-text-primary">Resource</p>
                <p className="text-[10px] text-text-muted">15% weight</p>
              </div>
              <div className="p-3 bg-bg-hover rounded-lg text-center">
                <div className="text-lg font-bold text-accent-blue mb-1">✓</div>
                <p className="text-xs font-medium text-text-primary">Quality</p>
                <p className="text-[10px] text-text-muted">15% weight</p>
              </div>
            </div>

            {/* Performance Indices */}
            <div className="bg-bg-hover rounded-lg p-4">
              <h4 className="font-medium text-text-primary mb-3">Key Performance Indices</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <div>
                    <span className="text-text-primary font-medium">SPI (Schedule Performance Index)</span>
                    <p className="text-xs text-text-muted">% Complete ÷ % Time Elapsed</p>
                  </div>
                  <span className="text-text-secondary">1.0 = On schedule</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <div>
                    <span className="text-text-primary font-medium">CPI (Cost Performance Index)</span>
                    <p className="text-xs text-text-muted">% Complete ÷ % Budget Spent</p>
                  </div>
                  <span className="text-text-secondary">1.0 = On budget</span>
                </div>
              </div>
            </div>

            {/* Risk Factors by Dimension */}
            <div className="bg-bg-hover rounded-lg p-4">
              <h4 className="font-medium text-text-primary mb-3">Risk Factors Evaluated</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-accent-blue mb-2">Schedule (Time)</p>
                  <ul className="text-text-secondary space-y-1 text-xs">
                    <li>• SPI below target (behind schedule)</li>
                    <li>• Overdue tasks percentage</li>
                    <li>• Projects significantly behind</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-rag-green mb-2">Cost (Budget)</p>
                  <ul className="text-text-secondary space-y-1 text-xs">
                    <li>• CPI below target (over budget)</li>
                    <li>• Budget variance percentage</li>
                    <li>• Projects exceeding budget</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-accent-purple mb-2">Scope (Delivery)</p>
                  <ul className="text-text-secondary space-y-1 text-xs">
                    <li>• Completion vs timeline gap</li>
                    <li>• Scope change requests</li>
                    <li>• Task completion rate</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-rag-amber mb-2">Resource &amp; Quality</p>
                  <ul className="text-text-secondary space-y-1 text-xs">
                    <li>• Over-allocated team members</li>
                    <li>• Key person dependencies</li>
                    <li>• Blocked tasks ratio</li>
                    <li>• RAG status indicators</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Risk Levels */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 bg-rag-green/10 border border-rag-green/30 rounded-lg text-center">
                <p className="text-xl font-bold text-rag-green">0-25</p>
                <p className="text-sm text-text-secondary">Low</p>
              </div>
              <div className="p-3 bg-rag-amber/10 border border-rag-amber/30 rounded-lg text-center">
                <p className="text-xl font-bold text-rag-amber">26-50</p>
                <p className="text-sm text-text-secondary">Medium</p>
              </div>
              <div className="p-3 bg-rag-red/10 border border-rag-red/30 rounded-lg text-center">
                <p className="text-xl font-bold text-rag-red">51-75</p>
                <p className="text-sm text-text-secondary">High</p>
              </div>
              <div className="p-3 bg-rag-red/20 border border-rag-red/50 rounded-lg text-center">
                <p className="text-xl font-bold text-rag-red">76-100</p>
                <p className="text-sm text-text-secondary">Critical</p>
              </div>
            </div>

            <div className="p-4 bg-accent-blue/10 border border-accent-blue/30 rounded-lg">
              <p className="text-sm text-text-primary">
                <strong>Tip:</strong> Click on any Risk Score in the Portfolio grid to see the detailed
                breakdown including SPI, CPI, and individual risk factors contributing to the score.
              </p>
            </div>
          </div>
        </AccordionItem>

        <AccordionItem
          title="AI-Powered Insights"
          icon={<Sparkles className="w-5 h-5" />}
        >
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              StratOS AI uses Claude AI to analyze your organizational data and provide actionable insights:
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-bg-hover rounded-lg">
                <p className="font-medium text-text-primary">Executive Summary</p>
                <p className="text-sm text-text-secondary mt-1">
                  AI-generated overview of organizational health, highlighting key risks, opportunities,
                  and recommendations for leadership.
                </p>
              </div>

              <div className="p-3 bg-bg-hover rounded-lg">
                <p className="font-medium text-text-primary">Pillar Insights</p>
                <p className="text-sm text-text-secondary mt-1">
                  Specific analysis for each Balanced Scorecard pillar, identifying trends and areas
                  needing attention.
                </p>
              </div>

              <div className="p-3 bg-bg-hover rounded-lg">
                <p className="font-medium text-text-primary">Project Suggestions</p>
                <p className="text-sm text-text-secondary mt-1">
                  AI "Fix-it" suggestions for projects showing risk indicators, with actionable
                  recommendations to get back on track.
                </p>
              </div>

              <div className="p-3 bg-bg-hover rounded-lg">
                <p className="font-medium text-text-primary">Resource Alerts</p>
                <p className="text-sm text-text-secondary mt-1">
                  Identifies team members who may be over-allocated or underutilized based on
                  task assignments and capacity.
                </p>
              </div>
            </div>

            <div className="p-4 bg-accent-blue/10 border border-accent-blue/30 rounded-lg">
              <p className="text-sm text-text-primary">
                <strong>Setup:</strong> To enable AI insights, go to{' '}
                <Link to="/settings" className="text-accent-blue hover:underline">Settings</Link>
                {' '}and enter your Claude API key.
              </p>
            </div>
          </div>
        </AccordionItem>

        <AccordionItem
          title="User Personas & Views"
          icon={<Users className="w-5 h-5" />}
        >
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              StratOS AI is designed for different user personas, each with their own focus and default view:
            </p>

            <div className="space-y-3">
              <div className="p-4 bg-bg-hover rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-5 h-5 text-accent-blue" />
                  <span className="font-medium text-text-primary">Board of Directors / C-Suite</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Focus on strategic health, outcomes, and high-level risks. Uses the Strategic Command
                  Center with BSC cards and AI executive summary.
                </p>
              </div>

              <div className="p-4 bg-bg-hover rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="w-5 h-5 text-accent-purple" />
                  <span className="font-medium text-text-primary">PMO (Project Management Office)</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Focus on portfolio health, resource allocation, and systemic risks. Uses the Portfolio
                  Oversight Hub with roadmap and data grid views.
                </p>
              </div>

              <div className="p-4 bg-bg-hover rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <FolderKanban className="w-5 h-5 text-accent-cyan" />
                  <span className="font-medium text-text-primary">Business Process Owner</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Focus on execution, team performance, and task delivery. Uses the Operational Delivery
                  Dashboard with Kanban board and project KPIs.
                </p>
              </div>
            </div>
          </div>
        </AccordionItem>

        <AccordionItem
          title="Budget & Financial Tracking"
          icon={<DollarSign className="w-5 h-5" />}
        >
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Budget tracking is available at both Initiative and Project levels:
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-bg-hover rounded-lg">
                <p className="font-medium text-text-primary">Budget Allocation</p>
                <p className="text-sm text-text-secondary mt-1">
                  Each initiative and project has an allocated budget set during creation or import.
                </p>
              </div>

              <div className="p-3 bg-bg-hover rounded-lg">
                <p className="font-medium text-text-primary">Spent Budget</p>
                <p className="text-sm text-text-secondary mt-1">
                  Track actual spend against allocated budget. Update this as costs are incurred.
                </p>
              </div>

              <div className="p-3 bg-bg-hover rounded-lg">
                <p className="font-medium text-text-primary">Budget Variance</p>
                <p className="text-sm text-text-secondary mt-1">
                  The difference between spent and allocated budget. Positive values (red) indicate
                  overspend; negative values (green) indicate underspend.
                </p>
              </div>
            </div>

            <div className="p-4 bg-rag-amber/10 border border-rag-amber/30 rounded-lg">
              <p className="text-sm text-text-primary">
                <strong>Tip:</strong> Budget overruns impact the Risk Score. Initiatives exceeding
                budget by more than 10% receive a significant risk penalty.
              </p>
            </div>
          </div>
        </AccordionItem>

        <AccordionItem
          title="Data Import & Export"
          icon={<FileDown className="w-5 h-5" />}
        >
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              StratOS AI supports Excel-based data import and export for offline planning:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-bg-hover rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileDown className="w-5 h-5 text-accent-blue" />
                  <span className="font-medium text-text-primary">Export</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Download your data as an Excel file with all pillars, KPIs, initiatives, projects,
                  tasks, and resources. Use for reporting or as a template for bulk updates.
                </p>
                <Link
                  to="/export"
                  className="inline-flex items-center gap-1 mt-2 text-sm text-accent-blue hover:underline"
                >
                  Go to Export <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="p-4 bg-bg-hover rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileUp className="w-5 h-5 text-rag-green" />
                  <span className="font-medium text-text-primary">Smart Import</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Upload Excel files and use the spreadsheet view to map your data to entity fields.
                  Select cells and assign labels from the sidebar.
                </p>
                <Link
                  to="/import"
                  className="inline-flex items-center gap-1 mt-2 text-sm text-accent-blue hover:underline"
                >
                  Go to Import <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Smart Import How-To */}
            <div className="mt-4 p-4 bg-accent-purple/10 border border-accent-purple/30 rounded-lg">
              <h4 className="font-medium text-text-primary mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-purple" />
                How to Use Smart Import
              </h4>
              <ol className="text-sm text-text-secondary space-y-2 list-decimal ml-4">
                <li><strong>Upload:</strong> Drag and drop or select your Excel file (.xlsx, .xls)</li>
                <li><strong>Select Sheet:</strong> Choose which sheets to import and set entity type for each (Pillar, Initiative, Project, Task, etc.)</li>
                <li><strong>Map Data:</strong> In the spreadsheet view:
                  <ul className="list-disc ml-4 mt-1">
                    <li>Click cells to select, drag to select range, Ctrl/Cmd+click for multi-select</li>
                    <li>Choose a label from the sidebar (entity fields or reference data)</li>
                    <li>Click "Assign" to map selected cells to the label</li>
                    <li>Double-click any cell to edit its value</li>
                  </ul>
                </li>
                <li><strong>Preview:</strong> Review validation results before importing</li>
                <li><strong>Import:</strong> Confirm and import your data into the system</li>
              </ol>
            </div>

            {/* PMO Recommended Workflow */}
            <div className="mt-4 p-4 bg-accent-blue/10 border border-accent-blue/30 rounded-lg">
              <h4 className="font-medium text-text-primary mb-3">PMO Recommended Workflow</h4>
              <div className="text-sm text-text-secondary space-y-2">
                <p><strong>For Initial Setup:</strong></p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>First import <strong>Strategy Pillars</strong> (BSC perspectives) - these are the foundation</li>
                  <li>Then import <strong>KPIs</strong> linked to pillars (strategic metrics)</li>
                  <li>Add <strong>Initiatives</strong> linked to pillars (programs/portfolios)</li>
                  <li>Create <strong>Projects</strong> linked to initiatives</li>
                  <li>Finally, add <strong>Tasks</strong> and <strong>Resources</strong></li>
                </ol>
                <p className="mt-3"><strong>Essential Fields by Entity:</strong></p>
                <ul className="list-disc ml-4 space-y-1">
                  <li><strong>Pillar:</strong> Name (required), RAG Status</li>
                  <li><strong>KPI:</strong> Name, Pillar*, Target Value, Current Value</li>
                  <li><strong>Initiative:</strong> Name, Pillar*, Owner, Start/End Dates, Budget</li>
                  <li><strong>Project:</strong> Name, Initiative*, Manager, Status, Dates, Budget</li>
                  <li><strong>Task:</strong> Title, Project*, Assignee, Due Date, Status</li>
                  <li><strong>Resource:</strong> Name, Email, Role, Department</li>
                </ul>
                <p className="text-xs mt-2 italic">* Required parent reference</p>
              </div>
            </div>
          </div>
        </AccordionItem>

        <AccordionItem
          title="Settings & Configuration"
          icon={<Settings className="w-5 h-5" />}
        >
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Configure the platform to match your preferences:
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-bg-hover rounded-lg">
                <p className="font-medium text-text-primary">Claude API Key</p>
                <p className="text-sm text-text-secondary mt-1">
                  Enter your Anthropic API key to enable AI-powered insights and suggestions.
                </p>
              </div>

              <div className="p-3 bg-bg-hover rounded-lg">
                <p className="font-medium text-text-primary">Data Storage</p>
                <p className="text-sm text-text-secondary mt-1">
                  View storage usage and entity breakdown. Expand to see counts for each entity type.
                </p>
              </div>

              <div className="p-3 bg-bg-hover rounded-lg">
                <p className="font-medium text-text-primary">Entity Management</p>
                <p className="text-sm text-text-secondary mt-1">
                  Clear specific entity types (Pillars, KPIs, Initiatives, Projects, Tasks, Resources, Milestones).
                  System warns you about orphaned child records before deletion.
                </p>
              </div>

              <div className="p-3 bg-bg-hover rounded-lg">
                <p className="font-medium text-text-primary">Orphan Cleanup</p>
                <p className="text-sm text-text-secondary mt-1">
                  If you have items with invalid parent references (e.g., a Task pointing to a deleted Project),
                  the system will detect and let you clean them up.
                </p>
              </div>

              <div className="p-3 bg-bg-hover rounded-lg">
                <p className="font-medium text-text-primary">Reset / Clear All</p>
                <p className="text-sm text-text-secondary mt-1">
                  Reset to demo data or clear everything. Use with caution - these actions cannot be undone.
                </p>
              </div>
            </div>

            <Link
              to="/settings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Go to Settings
            </Link>
          </div>
        </AccordionItem>
      </div>

      {/* Footer */}
      <div className="bg-bg-card rounded-xl border border-border p-5 text-center">
        <p className="text-sm text-text-secondary">
          Need more help? Check the{' '}
          <Link to="/insights" className="text-accent-blue hover:underline">AI Insights</Link>
          {' '}page for personalized recommendations based on your data.
        </p>
      </div>
    </div>
  );
};

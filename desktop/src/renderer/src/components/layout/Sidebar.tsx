import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, CheckCircle2, FileText, GitBranch,
  Users, ListChecks, Package, BookOpen, FileCode,
  Info, Radio, Clock, Server, Stethoscope, Settings,
  Menu, ChevronsLeft, Plug
} from 'lucide-react'

interface NavItemProps {
  to: string
  icon: React.ReactNode
  label: string
  badge?: string | number
  badgeColor?: string
  collapsed?: boolean
}

function NavItem({ to, icon, label, badge, badgeColor = 'bg-indigo-500/20 text-indigo-400', collapsed }: NavItemProps): JSX.Element {
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 py-2 mx-2 rounded-lg text-sm transition-colors relative ${
          collapsed ? 'justify-center px-2' : 'px-4'
        } ${
          isActive
            ? 'bg-indigo-500/15 text-indigo-300 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:bg-indigo-500 before:rounded-full'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        }`
      }
    >
      {icon}
      {!collapsed && <span className="flex-1">{label}</span>}
      {!collapsed && badge !== undefined && (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
          {badge}
        </span>
      )}
    </NavLink>
  )
}

function SectionLabel({ children, collapsed }: { children: React.ReactNode; collapsed?: boolean }): JSX.Element {
  if (collapsed) {
    return <div className="border-t border-slate-700/50 mx-3 my-2" />
  }
  return (
    <div className="px-6 pt-5 pb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
      {children}
    </div>
  )
}

interface SidebarProps {
  onOpenPalette?: () => void
  collapsed: boolean
  onToggleCollapsed: () => void
  featureCount?: number
  installed?: boolean
}

export function Sidebar({ onOpenPalette, collapsed, onToggleCollapsed, featureCount = 0, installed }: SidebarProps): JSX.Element {
  return (
    <div className="h-full bg-gradient-to-b from-[#0F172A] to-[#1E293B] flex flex-col">
      {/* Logo + Hamburger */}
      <div className={`py-4 flex items-center ${collapsed ? 'justify-center px-2' : 'px-4 gap-3'}`}>
        {collapsed ? (
          <button
            onClick={onToggleCollapsed}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center hover:opacity-90 transition-opacity"
            title="Expand sidebar"
          >
            <Menu size={16} className="text-white" />
          </button>
        ) : (
          <>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-lg leading-none">Looply</div>
              <div className="text-slate-500 text-[10px]">v2.0.0</div>
            </div>
            <button
              onClick={onToggleCollapsed}
              className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronsLeft size={14} />
            </button>
          </>
        )}
      </div>

      {/* Search — opens command palette */}
      {!collapsed ? (
        <div className="px-4 pb-2">
          <button
            onClick={onOpenPalette}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1E293B] border border-slate-700 text-slate-500 text-xs hover:border-slate-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="flex-1 text-left">Search commands...</span>
            <kbd className="text-[10px] text-slate-600 font-mono">⌘K</kbd>
          </button>
        </div>
      ) : (
        <div className="px-2 pb-2">
          <button
            onClick={onOpenPalette}
            title="Search (⌘K)"
            className="w-full flex items-center justify-center py-2 rounded-lg bg-[#1E293B] border border-slate-700 text-slate-500 hover:border-slate-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto pb-4">
        <SectionLabel collapsed={collapsed}>Overview</SectionLabel>
        <NavItem to="/" icon={<LayoutDashboard size={16} />} label="Dashboard" collapsed={collapsed} />
        <NavItem to="/status" icon={<CheckCircle2 size={16} />} label="Status"
          badge={installed ? 'OK' : '!'}
          badgeColor={installed ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}
          collapsed={collapsed} />

        <SectionLabel collapsed={collapsed}>Workflows</SectionLabel>
        <NavItem to="/features" icon={<FileText size={16} />} label="Features"
          badge={featureCount > 0 ? featureCount : undefined}
          collapsed={collapsed} />
        <NavItem to="/workflows" icon={<GitBranch size={16} />} label="Workflows" collapsed={collapsed} />
        <NavItem to="/agents" icon={<Users size={16} />} label="Agents" collapsed={collapsed} />
        <NavItem to="/tasks" icon={<ListChecks size={16} />} label="Tasks" collapsed={collapsed} />

        <SectionLabel collapsed={collapsed}>Knowledge</SectionLabel>
        <NavItem to="/packs" icon={<Package size={16} />} label="Packs" collapsed={collapsed} />
        <NavItem to="/knowledge" icon={<BookOpen size={16} />} label="Knowledge Base" collapsed={collapsed} />
        <NavItem to="/templates" icon={<FileCode size={16} />} label="Templates" collapsed={collapsed} />

        <SectionLabel collapsed={collapsed}>Project</SectionLabel>
        <NavItem to="/context" icon={<Info size={16} />} label="Context" collapsed={collapsed} />
        <NavItem to="/sessions" icon={<Radio size={16} />} label="Sessions" collapsed={collapsed} />
        <NavItem to="/history" icon={<Clock size={16} />} label="History" collapsed={collapsed} />
        <NavItem to="/integrations" icon={<Plug size={16} />} label="Integrations" collapsed={collapsed} />

        <SectionLabel collapsed={collapsed}>Help</SectionLabel>
        <NavItem to="/docs" icon={<BookOpen size={16} />} label="Docs & Commands" collapsed={collapsed} />

        <SectionLabel collapsed={collapsed}>Settings</SectionLabel>
        <NavItem to="/hosts" icon={<Server size={16} />} label="Hosts" collapsed={collapsed} />
        <NavItem to="/doctor" icon={<Stethoscope size={16} />} label="Doctor" collapsed={collapsed} />
        <NavItem to="/settings" icon={<Settings size={16} />} label="Settings" collapsed={collapsed} />
      </nav>

      {/* Footer */}
      <div className={`border-t border-slate-700 p-4 flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0" title={collapsed ? 'Project: looply' : undefined}>
          <span className="text-slate-200 text-xs font-semibold">RM</span>
        </div>
        {!collapsed && (
          <div>
            <div className="text-slate-200 text-xs font-medium">Project</div>
            <div className="text-slate-500 text-[10px]">looply</div>
          </div>
        )}
      </div>
    </div>
  )
}

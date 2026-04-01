import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { StatusPage } from './components/status/StatusPage'
import { FeatureListPage } from './components/features/FeatureListPage'
import { FeatureDetailPage } from './components/features/FeatureDetailPage'
import { WorkflowListPage } from './components/workflows/WorkflowListPage'
import { AgentListPage } from './components/agents/AgentListPage'
import { TaskListPage } from './components/tasks/TaskListPage'
import { PackListPage } from './components/packs/PackListPage'
import { KnowledgePage } from './components/knowledge/KnowledgePage'
import { TemplatePage } from './components/templates/TemplatePage'
import { ContextPage } from './components/context/ContextPage'
import { SessionListPage } from './components/sessions/SessionListPage'
import { HistoryTimelinePage } from './components/history/HistoryTimelinePage'
import { HostsPage } from './components/hosts/HostsPage'
import { DoctorPage } from './components/doctor/DoctorPage'
import { SettingsPage } from './components/settings/SettingsPage'
import { ArtifactDetailPage } from './components/artifacts/ArtifactDetailPage'
import { IntegrationsPage } from './components/integrations/IntegrationsPage'
import { DocsPage } from './components/docs/DocsPage'

function Page({ children }: { children: React.ReactNode }): JSX.Element {
  return <ErrorBoundary>{children}</ErrorBoundary>
}

export function App(): JSX.Element {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Page><DashboardPage /></Page>} />
          <Route path="/status" element={<Page><StatusPage /></Page>} />
          <Route path="/features" element={<Page><FeatureListPage /></Page>} />
          <Route path="/features/:name" element={<Page><FeatureDetailPage /></Page>} />
          <Route path="/workflows" element={<Page><WorkflowListPage /></Page>} />
          <Route path="/agents" element={<Page><AgentListPage /></Page>} />
          <Route path="/tasks" element={<Page><TaskListPage /></Page>} />
          <Route path="/packs" element={<Page><PackListPage /></Page>} />
          <Route path="/knowledge" element={<Page><KnowledgePage /></Page>} />
          <Route path="/templates" element={<Page><TemplatePage /></Page>} />
          <Route path="/context" element={<Page><ContextPage /></Page>} />
          <Route path="/sessions" element={<Page><SessionListPage /></Page>} />
          <Route path="/history" element={<Page><HistoryTimelinePage /></Page>} />
          <Route path="/hosts" element={<Page><HostsPage /></Page>} />
          <Route path="/doctor" element={<Page><DoctorPage /></Page>} />
          <Route path="/settings" element={<Page><SettingsPage /></Page>} />
          <Route path="/integrations" element={<Page><IntegrationsPage /></Page>} />
          <Route path="/docs" element={<Page><DocsPage /></Page>} />
          <Route path="/artifacts/:type/:name" element={<Page><ArtifactDetailPage /></Page>} />
        </Routes>
      </AppShell>
    </HashRouter>
  )
}

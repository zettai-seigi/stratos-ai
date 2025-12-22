import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { AIProvider } from './context/AIContext';
import { ConfigProvider } from './context/ConfigContext';
import { Layout } from './components/layout/Layout';
import { StrategicCommandCenter } from './components/dashboard/StrategicCommandCenter';
import { PortfolioHub } from './components/dashboard/PortfolioHub';
import { OperationalDashboard } from './components/dashboard/OperationalDashboard';
import { StrategyHubPage } from './pages/StrategyHubPage';
import { AIInsightsPage } from './pages/AIInsightsPage';
import { ExportPage } from './pages/ExportPage';
import { ImportPage } from './pages/ImportPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpPage } from './pages/HelpPage';
import { ProjectCharterPage } from './pages/ProjectCharterPage';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <ConfigProvider>
        <AppProvider>
          <AIProvider>
            <HashRouter>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<StrategicCommandCenter />} />
                  <Route path="strategy" element={<StrategyHubPage />} />
                  <Route path="portfolio" element={<PortfolioHub />} />
                  <Route path="execution" element={<OperationalDashboard />} />
                  <Route path="execution/:projectId" element={<OperationalDashboard />} />
                  <Route path="project/:projectId" element={<ProjectCharterPage />} />
                  <Route path="insights" element={<AIInsightsPage />} />
                  <Route path="export" element={<ExportPage />} />
                  <Route path="import" element={<ImportPage />} />
                  <Route path="resources" element={<ResourcesPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="help" element={<HelpPage />} />
                </Route>
              </Routes>
            </HashRouter>
          </AIProvider>
        </AppProvider>
      </ConfigProvider>
    </ThemeProvider>
  );
}

export default App;

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/layout/Layout';
import { StrategicCommandCenter } from './components/dashboard/StrategicCommandCenter';
import { PortfolioHub } from './components/dashboard/PortfolioHub';
import { OperationalDashboard } from './components/dashboard/OperationalDashboard';
import { ExportPage } from './pages/ExportPage';
import { ImportPage } from './pages/ImportPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { SettingsPage } from './pages/SettingsPage';
import './index.css';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<StrategicCommandCenter />} />
            <Route path="strategy" element={<StrategicCommandCenter />} />
            <Route path="portfolio" element={<PortfolioHub />} />
            <Route path="execution" element={<OperationalDashboard />} />
            <Route path="execution/:projectId" element={<OperationalDashboard />} />
            <Route path="insights" element={<StrategicCommandCenter />} />
            <Route path="export" element={<ExportPage />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;

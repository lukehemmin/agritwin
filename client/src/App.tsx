import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { Loading } from './components/common/Loading';

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const SensorDetail = React.lazy(() => import('./pages/SensorDetail'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Settings = React.lazy(() => import('./pages/Settings'));

function App() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      
      <div className="flex-1 flex overflow-hidden min-h-0">
        <Sidebar />
        
        <main className="flex-1 overflow-hidden">
          <React.Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/sensor/:id" element={<SensorDetail />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </React.Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;
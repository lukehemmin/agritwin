import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { Loading } from './components/common/Loading';
import { NotificationModal } from './components/common/NotificationModal';
import { NotificationToast, ToastNotification } from './components/common/NotificationToast';
import { useWebSocket } from './hooks/useWebSocket';

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const SensorDetail = React.lazy(() => import('./pages/SensorDetail'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Settings = React.lazy(() => import('./pages/Settings'));

function App() {
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());
  const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([]);
  const [previousAlertIds, setPreviousAlertIds] = useState<Set<string>>(new Set());
  
  const { alerts } = useWebSocket();

  // Handle alert acknowledgment
  const handleAcknowledgeAlert = (alertId: string) => {
    setAcknowledgedAlerts(prev => new Set([...prev, alertId]));
  };

  // Process alerts with acknowledgment status - add id if missing
  const processedAlerts = alerts.map((alert, index) => {
    const alertWithId = {
      ...alert,
      id: `alert-${alert.sensor_id}-${alert.timestamp}-${index}` // Generate ID from available data
    };
    return {
      ...alertWithId,
      acknowledged: acknowledgedAlerts.has(alertWithId.id)
    };
  });

  // Handle new alerts - show toast notifications
  useEffect(() => {
    if (alerts.length > 0) {
      const alertsWithIds = alerts.map((alert, index) => ({
        ...alert,
        id: `alert-${alert.sensor_id}-${alert.timestamp}-${index}`
      }));
      
      const currentAlertIds = new Set(alertsWithIds.map(alert => alert.id));
      const newAlerts = alertsWithIds.filter(alert => !previousAlertIds.has(alert.id));
      
      if (newAlerts.length > 0) {
        // Create toast notifications for new alerts
        const newToasts: ToastNotification[] = newAlerts.map(alert => ({
          id: alert.id,
          message: alert.message,
          severity: alert.severity,
          timestamp: alert.timestamp,
          autoClose: alert.severity !== 'critical', // Critical alerts don't auto-close
          duration: alert.severity === 'critical' ? undefined : 6000
        }));

        setToastNotifications(prev => [...prev, ...newToasts]);
      }
      
      setPreviousAlertIds(currentAlertIds);
    }
  }, [alerts, previousAlertIds]);

  // Toast notification handlers
  const handleCloseToast = (toastId: string) => {
    setToastNotifications(prev => prev.filter(toast => toast.id !== toastId));
  };

  const handleClickToast = (toastId: string) => {
    // Close the toast and open notification modal
    handleCloseToast(toastId);
    setIsNotificationModalOpen(true);
  };

  const unreadCount = processedAlerts.filter(alert => !alert.acknowledged).length;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header 
        onNotificationClick={() => setIsNotificationModalOpen(true)}
        unreadNotificationCount={unreadCount}
      />
      
      <div className="flex-1 flex overflow-hidden min-h-0">
        <Sidebar />
        
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
          <React.Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/sensor/:id" element={<SensorDetail />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </React.Suspense>
          </div>
        </main>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        alerts={processedAlerts}
        onAcknowledge={handleAcknowledgeAlert}
      />

      {/* Toast Notifications */}
      <NotificationToast
        notifications={toastNotifications}
        onClose={handleCloseToast}
        onClickNotification={handleClickToast}
        maxVisible={2}
      />
    </div>
  );
}

export default App;
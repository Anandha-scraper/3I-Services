import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './sidebar';
import { useAuth } from '../context/AuthContext';
import '../styles/componentstyles/Dashboard.css';

export default function Dashboard({ activeTab, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen((o) => !o);
  const closeMobileSidebar = () => setIsSidebarOpen(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    logout();
    navigate('/login');
  };

  const handleTabChange = (tabId) => {
    navigate(`/${tabId}`);
  };

  return (
    <div className="common-dashboard">
      <Sidebar
        isMobile={isMobile}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        onCloseMobile={closeMobileSidebar}
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        onLogout={handleLogout}
      />

      <main className="common-dashboard-main">
        <div className="common-dashboard-body">
          {children}
        </div>
      </main>
    </div>
  );
}
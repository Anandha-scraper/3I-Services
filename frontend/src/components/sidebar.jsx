import { Home, FileSpreadsheet, Table2, LogOut, UploadCloud, UserCircle } from 'lucide-react';
import '../styles/componentstyles/sidebar.css';
import threeiLogo from '../images/logo.svg';

const NAV_ITEMS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'excel', icon: UploadCloud, label: 'Upload Files' },
  { id: 'view', icon: Table2, label: 'View data' },
  { id: 'notify', icon: FileSpreadsheet, label: 'Collection Details' },
];

export default function Sidebar({
  isMobile,
  isOpen,
  onToggle,
  onCloseMobile,
  activeTab,
  onSelectTab,
  onLogout,
  logoTitle = '3i Services',
  userRole,
}) {
  const visibleItems = userRole === 'admin'
    ? NAV_ITEMS
    : NAV_ITEMS.filter(item => item.id !== 'excel');
  return (
    <div className="sidebar-root">
      <div
        role="presentation"
        className={`sidebar-overlay ${isMobile && isOpen ? 'active' : ''}`}
        onClick={onCloseMobile}
      />

      <aside className={`sidebar ${isMobile && isOpen ? 'mobile-visible' : ''}`}>
        <div className="sidebar__header">
          <div
            className="sidebar__brand"
            onClick={onToggle}
            onKeyDown={(e) => e.key === 'Enter' && onToggle()}
            role="button"
            tabIndex={0}
          >
            <img 
              src={threeiLogo} 
              alt="3i Services Logo"
              className="sidebar__brand-logo"
            />
            <span className="sidebar__logo-text">{logoTitle}</span>
          </div>
        </div>

        <nav className="sidebar__nav" aria-label="Main">
          {visibleItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              className={`sidebar__nav-item ${activeTab === id ? 'active' : ''}`}
              onClick={() => {
                onSelectTab(id);
                if (isMobile) onCloseMobile?.();
              }}
            >
              <span className="sidebar__nav-icon">
                <Icon size={20} />
              </span>
              <span className="sidebar__nav-label">{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar__bottom">
          <button
            type="button"
            className={`sidebar__nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => {
              onSelectTab('profile');
              if (isMobile) onCloseMobile?.();
            }}
          >
            <span className="sidebar__nav-icon">
              <UserCircle size={20} />
            </span>
            <span className="sidebar__nav-label">My Profile</span>
          </button>
        </div>

        <div className="sidebar__logout-wrap">
          <button type="button" className="sidebar__logout-btn" onClick={onLogout}>
            <span className="sidebar__nav-icon">
              <LogOut size={20} />
            </span>
            <span className="sidebar__logout-text sidebar__logout-label">Logout</span>
          </button>
        </div>
      </aside>
    </div>
  );
}

export { NAV_ITEMS };

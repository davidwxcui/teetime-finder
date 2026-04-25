import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, Bell, Activity, Play, Zap, Menu, X } from 'lucide-react';

const Sidebar = ({ onRun, isOpen, onToggle, onNavigate }) => {
  return (
    <>
      {/* Hamburger Menu Button */}
      <button 
        className="hamburger-menu"
        onClick={onToggle}
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={onToggle}></div>}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Zap size={24} color="white" />
          </div>
          <div className="logo-text">
            <h2>Tee Time Scraper</h2>
            <p>Golf Automation</p>
          </div>
        </div>

        <nav className="nav-links">
          <NavLink 
            to="/" 
            end 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onNavigate}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink 
            to="/search" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onNavigate}
          >
            <Search size={20} />
            <span>Search Settings</span>
          </NavLink>
          <NavLink 
            to="/notifications" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onNavigate}
          >
            <Bell size={20} />
            <span>Notification Settings</span>
          </NavLink>
          <NavLink 
            to="/logs" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onNavigate}
          >
            <Activity size={20} />
            <span>Activity Logs</span>
          </NavLink>
          <a 
            href="#" 
            className="nav-item" 
            onClick={(e) => { 
              e.preventDefault(); 
              onRun();
              onNavigate();
            }}
          >
            <Play size={20} />
            <span>Run Scraper</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="status-card">
            <p className="status-header">System Status</p>
            <div className="status-badge">
              <div className="status-dot"></div>
              <span>Operational</span>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>Version 1.0.0</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, Bell, Activity, Play, Zap } from 'lucide-react';

const Sidebar = ({ onRun }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Zap size={24} color="white" />
        </div>
        <div className="logo-text">
          <h2>Twilio Scraper</h2>
          <p>SMS Automation</p>
        </div>
      </div>

      <nav className="nav-links">
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Search size={20} />
          Search Settings
        </NavLink>
        <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Bell size={20} />
          Notification Settings
        </NavLink>
        <NavLink to="/logs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Activity size={20} />
          Activity Logs
        </NavLink>
        <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); onRun(); }}>
          <Play size={20} />
          Run Scraper
        </a>
      </nav>

      <div className="sidebar-footer">
        <div className="status-card">
          <p className="status-header">System Status</p>
          <div className="status-badge">
            <div className="status-dot"></div>
            Operational
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>Version 1.0.0</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

import React from 'react';
import { Play } from 'lucide-react';

const DashboardHeader = ({ onRun, onStop, running }) => {
  return (
    <header className="page-header">
      <div className="header-title">
        <h1>Search & Notification Settings</h1>
        <p>Configure your search parameters and Twilio notification preferences</p>
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        {running ? (
          <button className="btn btn-secondary" style={{ backgroundColor: '#ef4444', color: 'white', border: 'none' }} onClick={onStop}>
            <Play size={18} style={{ transform: 'rotate(90deg)' }} />
            Stop Scraper
          </button>
        ) : (
          <button className="btn btn-run" onClick={onRun}>
            <Play size={18} />
            Run Scraper Now
          </button>
        )}
      </div>
    </header>
  );
};

export default DashboardHeader;

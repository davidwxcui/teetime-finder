import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Component Imports
import Sidebar from './components/Sidebar';
import DashboardHeader from './components/DashboardHeader';
import SearchSettings from './components/SearchSettings';
import NotificationSettings from './components/NotificationSettings';
import ActivityLog from './components/ActivityLog';

const API_BASE = ''; 

function App() {
  const [config, setConfig] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetchConfig();
    const logInterval = setInterval(fetchLogs, 2000);
    return () => clearInterval(logInterval);
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/config`);
      setConfig(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch config', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/logs`);
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/config`, config);
      alert('Settings saved successfully!');
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    try {
      await axios.post(`${API_BASE}/api/run`);
      alert('Scraper triggered! Check logs for progress.');
    } catch (err) {
      alert('Failed to trigger scraper');
    } finally {
      setRunning(false);
    }
  };

  const handleStop = async () => {
    try {
      await axios.post(`${API_BASE}/api/stop`);
      setRunning(false);
      alert('Stop signal sent. The scraper will abort soon.');
    } catch (err) {
      alert('Failed to send stop signal');
    }
  };

  const toggleCourse = (group, course) => {
    const currentCourses = config.search[group].courses;
    const newCourses = currentCourses.includes(course)
      ? currentCourses.filter(c => c !== course)
      : [...currentCourses, course];
    
    setConfig({
      ...config,
      search: {
        ...config.search,
        [group]: {
          ...config.search[group],
          enabled: newCourses.length > 0,
          courses: newCourses
        }
      }
    });
  };

  if (loading || !config) return <div className="loading">Loading Configuration...</div>;

  return (
    <Router>
      <div className="app-container">
        <Sidebar onRun={handleRun} />

        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <>
                <DashboardHeader onRun={handleRun} onStop={handleStop} running={running} />
                <div className="grid">
                  <SearchSettings 
                    config={config} 
                    setConfig={setConfig} 
                    toggleCourse={toggleCourse} 
                  />
                  <NotificationSettings 
                    config={config} 
                    setConfig={setConfig} 
                    onSave={handleSave} 
                    saving={saving} 
                  />
                  <ActivityLog 
                    logs={logs} 
                    onClear={() => setLogs([])} 
                  />
                </div>
              </>
            } />
            <Route path="/search" element={
              <>
                <DashboardHeader onRun={handleRun} onStop={handleStop} running={running} />
                <SearchSettings 
                  config={config} 
                  setConfig={setConfig} 
                  toggleCourse={toggleCourse} 
                />
              </>
            } />
            <Route path="/notifications" element={
              <>
                <DashboardHeader onRun={handleRun} onStop={handleStop} running={running} />
                <NotificationSettings 
                  config={config} 
                  setConfig={setConfig} 
                  onSave={handleSave} 
                  saving={saving} 
                />
              </>
            } />
            <Route path="/logs" element={
              <>
                <header className="page-header">
                  <div className="header-title">
                    <h1>Live Activity Logs</h1>
                    <p>Real-time monitoring of scraper activity</p>
                  </div>
                  <button 
                    className="btn" 
                    style={{ background: 'none', border: '1px solid var(--border)', width: 'auto' }}
                    onClick={() => setLogs([])}
                  >
                    Clear History
                  </button>
                </header>
                <div className="full-logs-container">
                  {logs.length === 0 ? (
                    <div className="log-entry">Waiting for activity...</div>
                  ) : (
                    logs.map((log, i) => (
                      <div key={i} className="log-entry">
                        <span className="log-time">{log.time}</span>
                        <span className="log-icon">{log.msg.includes('✅') ? '🟢' : log.msg.includes('❌') ? '🔴' : '🔵'}</span>
                        <span className="log-text">{log.msg}</span>
                      </div>
                    ))
                  )}
                </div>
              </>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

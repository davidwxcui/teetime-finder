import React, { useRef, useEffect } from 'react';
import { Activity } from 'lucide-react';

const ActivityLog = ({ logs, onClear }) => {
  return (
    <section className="card logs-section" id="activity-logs">
      <div className="card-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="card-icon"><Activity size={20} /></div>
          <h3>Live Activity Logs</h3>
        </div>
        <button 
          style={{ background: 'none', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={onClear}
        >
          Clear Logs
        </button>
      </div>

      <div className="logs-container">
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
    </section>
  );
};

export default ActivityLog;

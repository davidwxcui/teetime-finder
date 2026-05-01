import React from 'react';
import { Search, CheckCircle2, Clock, Calendar, Save, Users } from 'lucide-react';

const SearchSettings = ({ config, setConfig, toggleCourse, onSave, saving }) => {
  const golferOptions = [
    { label: 'Any', value: 'any' },
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
  ];

  return (
    <section className="card" id="search-settings">
      <div className="card-header">
        <div className="card-icon"><Search size={20} /></div>
        <h3>Search Parameters</h3>
      </div>

      <div className="form-group">
        <label>Select Courses</label>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Vancouver Courses</p>
        <div className="checkbox-group">
          {['McCleery', 'Fraserview', 'Langara'].map(course => (
            <div 
              key={course}
              className={`checkbox-item ${config.search.vancouver.courses.includes(course) ? 'checked' : ''}`}
              onClick={() => toggleCourse('vancouver', course)}
            >
              {config.search.vancouver.courses.includes(course) ? <CheckCircle2 size={16} /> : <div style={{ width: 16 }}></div>}
              {course}
            </div>
          ))}
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '16px', marginBottom: '8px' }}>Burnaby Courses</p>
        <div className="checkbox-group">
          {['Riverway', 'Burnaby Mountain'].map(course => (
            <div 
              key={course}
              className={`checkbox-item ${config.search.burnaby.courses.includes(course) ? 'checked' : ''}`}
              onClick={() => toggleCourse('burnaby', course)}
            >
              {config.search.burnaby.courses.includes(course) ? <CheckCircle2 size={16} /> : <div style={{ width: 16 }}></div>}
              {course}
            </div>
          ))}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Start Hour (24h)</label>
          <div style={{ position: 'relative' }}>
            <Clock size={16} style={{ position: 'absolute', right: 12, top: 14, color: 'var(--text-muted)' }} />
            <input 
              type="number" 
              value={config.search.startTime} 
              onChange={e => setConfig({ ...config, search: { ...config.search, startTime: parseInt(e.target.value) } })}
            />
          </div>
        </div>
        <div className="form-group">
          <label>End Hour (24h)</label>
          <div style={{ position: 'relative' }}>
            <Clock size={16} style={{ position: 'absolute', right: 12, top: 14, color: 'var(--text-muted)' }} />
            <input 
              type="number" 
              value={config.search.endTime} 
              onChange={e => setConfig({ ...config, search: { ...config.search, endTime: parseInt(e.target.value) } })}
            />
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Days to Search Ahead</label>
          <div style={{ position: 'relative' }}>
            <Calendar size={16} style={{ position: 'absolute', right: 12, top: 14, color: 'var(--text-muted)' }} />
            <input 
              type="number" 
              value={config.search.daysToSearch} 
              onChange={e => setConfig({ ...config, search: { ...config.search, daysToSearch: parseInt(e.target.value) } })}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Interval (Minutes)</label>
          <div style={{ position: 'relative' }}>
            <Clock size={16} style={{ position: 'absolute', right: 12, top: 14, color: 'var(--text-muted)' }} />
            <input 
              type="number" 
              min="0"
              value={config.search.intervalMinutes} 
              onChange={e => {
                const val = parseInt(e.target.value);
                setConfig({ ...config, search: { ...config.search, intervalMinutes: isNaN(val) ? 0 : Math.max(0, val) } });
              }}
            />
          </div>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '24px' }}>
        <label>Number of Golfers</label>
        <div className="golfer-selector" style={{ 
          display: 'flex', 
          gap: '8px', 
          marginTop: '8px',
          background: 'rgba(255,255,255,0.03)',
          padding: '6px',
          borderRadius: '12px',
          border: '1px solid var(--border)'
        }}>
          {golferOptions.map(option => (
            <div 
              key={option.value}
              className={`golfer-option ${config.search.golfers === option.value ? 'active' : ''}`}
              onClick={() => setConfig({ ...config, search: { ...config.search, golfers: option.value } })}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '10px 0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                background: config.search.golfers === option.value ? 'var(--primary)' : 'transparent',
                color: config.search.golfers === option.value ? 'white' : 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {option.value === 'any' ? <Users size={16} /> : <span style={{ fontSize: '1.1rem' }}>{option.value}</span>}
              <span style={{ fontSize: '0.75rem' }}>{option.label}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
          Filters for slots that accommodate your group size.
        </p>
      </div>

      <div className="toggle-group">
        <label className="switch">
          <input 
            type="checkbox" 
            checked={config.search.weekendsOnly}
            onChange={e => setConfig({ ...config, search: { ...config.search, weekendsOnly: e.target.checked } })}
          />
          <span className="slider"></span>
        </label>
        <div>
          <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Only search weekends</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Limit searches to Saturdays and Sundays only</p>
        </div>
      </div>

      <button className="btn btn-primary" onClick={onSave} disabled={saving} style={{ marginTop: '24px' }}>
        <Save size={18} />
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </section>
  );
};

export default SearchSettings;

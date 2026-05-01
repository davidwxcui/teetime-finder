import React from 'react';
import { Bell, Save } from 'lucide-react';

const NotificationSettings = ({ config, setConfig, onSave, saving }) => {
  return (
    <section className="card" id="notification-settings">
      <div className="card-header">
        <div className="card-icon"><Bell size={20} /></div>
        <h3>Notification Settings</h3>
      </div>

      <div className="notification-section">
        <div className="section-header">
          <h4>Twilio SMS</h4>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={config.twilio.enabled}
              onChange={e => setConfig({ ...config, twilio: { ...config.twilio, enabled: e.target.checked } })}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className={`section-content ${!config.twilio.enabled ? 'disabled' : ''}`}>
          <div className="form-group">
            <label>Twilio Account SID</label>
            <input 
              type="text" 
              value={config.twilio.accountSid} 
              disabled={!config.twilio.enabled}
              onChange={e => setConfig({ ...config, twilio: { ...config.twilio, accountSid: e.target.value } })}
            />
          </div>

          <div className="form-group">
            <label>Twilio Auth Token</label>
            <input 
              type="password" 
              value={config.twilio.authToken} 
              disabled={!config.twilio.enabled}
              onChange={e => setConfig({ ...config, twilio: { ...config.twilio, authToken: e.target.value } })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Twilio "From" Number</label>
              <input 
                type="text" 
                value={config.twilio.fromPhone} 
                disabled={!config.twilio.enabled}
                onChange={e => setConfig({ ...config, twilio: { ...config.twilio, fromPhone: e.target.value } })}
              />
            </div>

            <div className="form-group">
              <label>Your Phone Number</label>
              <input 
                type="text" 
                value={config.twilio.toPhone} 
                disabled={!config.twilio.enabled}
                onChange={e => setConfig({ ...config, twilio: { ...config.twilio, toPhone: e.target.value } })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="notification-section" style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
        <div className="section-header">
          <h4>Discord Webhook</h4>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={config.discord.enabled}
              onChange={e => setConfig({ ...config, discord: { ...config.discord, enabled: e.target.checked } })}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className={`section-content ${!config.discord.enabled ? 'disabled' : ''}`}>
          <div className="form-group">
            <label>Discord Webhook URL</label>
            <input 
              type="text" 
              placeholder="https://discord.com/api/webhooks/..."
              value={config.discord.webhookUrl} 
              disabled={!config.discord.enabled}
              onChange={e => setConfig({ ...config, discord: { ...config.discord, webhookUrl: e.target.value } })}
            />
          </div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={onSave} disabled={saving} style={{ marginTop: '24px' }}>
        <Save size={18} />
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </section>
  );
};

export default NotificationSettings;

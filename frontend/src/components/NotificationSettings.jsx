import React from 'react';
import { Bell, Save } from 'lucide-react';

const NotificationSettings = ({ config, setConfig, onSave, saving }) => {
  return (
    <section className="card" id="notification-settings">
      <div className="card-header">
        <div className="card-icon"><Bell size={20} /></div>
        <h3>Notification Settings</h3>
      </div>

      <div className="form-group">
        <label>Twilio Account SID</label>
        <input 
          type="text" 
          value={config.twilio.accountSid} 
          onChange={e => setConfig({ ...config, twilio: { ...config.twilio, accountSid: e.target.value } })}
        />
      </div>

      <div className="form-group">
        <label>Twilio Auth Token</label>
        <input 
          type="password" 
          value={config.twilio.authToken} 
          onChange={e => setConfig({ ...config, twilio: { ...config.twilio, authToken: e.target.value } })}
        />
      </div>

      <div className="form-group">
        <label>Twilio "From" Number</label>
        <input 
          type="text" 
          value={config.twilio.fromPhone} 
          onChange={e => setConfig({ ...config, twilio: { ...config.twilio, fromPhone: e.target.value } })}
        />
      </div>

      <div className="form-group">
        <label>Your Phone Number</label>
        <input 
          type="text" 
          value={config.twilio.toPhone} 
          onChange={e => setConfig({ ...config, twilio: { ...config.twilio, toPhone: e.target.value } })}
        />
      </div>

      <button className="btn btn-primary" onClick={onSave} disabled={saving}>
        <Save size={18} />
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </section>
  );
};

export default NotificationSettings;

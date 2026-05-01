const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { runAll, start, stopScraper } = require('./scrape');

const app = express();
const port = 5000;  // Changed from 3000 to 5000

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));


const CONFIG_PATH = path.join(__dirname, 'config.json');

let logs = [];
const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
  logs.push({ type: 'info', msg: args.join(' '), time: new Date().toLocaleTimeString() });
  if (logs.length > 100) logs.shift();
  originalLog.apply(console, args);
};

console.error = (...args) => {
  logs.push({ type: 'error', msg: args.join(' '), time: new Date().toLocaleTimeString() });
  if (logs.length > 100) logs.shift();
  originalError.apply(console, args);
};

app.get('/api/config', (req, res) => {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  res.json(config);
});

app.post('/api/config', (req, res) => {
  const newConfig = req.body;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
  console.log('⚙️ Settings updated and saved to config.json');
  res.json({ message: 'Config saved successfully' });
});

app.get('/api/logs', (req, res) => {
  res.json(logs);
});

let isScraperRunning = false;

app.get('/api/status', (req, res) => {
  res.json({ running: isScraperRunning });
});

app.post('/api/run', async (req, res) => {
  if (isScraperRunning) {
    console.log('⚠️ Manual run ignored: Scraper is already busy.');
    return res.status(400).json({ message: 'Scraper is already running' });
  }

  console.log('🚀 Scraper loop started from UI...');
  isScraperRunning = true;
  
  // Start the continuous loop in the background
  start().catch(err => {
    console.error('❌ Scraper loop error:', err.message);
  }).finally(() => {
    isScraperRunning = false;
  });

  res.json({ message: 'Scraper started' });
});

app.post('/api/stop', (req, res) => {
  console.log('🛑 Stop request received from UI...');
  stopScraper();
  res.json({ message: 'Stop signal sent' });
});

// Catch-all route for React SPA (must be last)
// Using a regex to avoid path-to-regexp issues in Express 5
app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});


app.listen(port, '0.0.0.0', () => {
  originalLog(`🚀 Tee Time Scraper Server running at:`);
  originalLog(`   Local: http://localhost:${port}`);
  originalLog(`   Network: http://${localIP}:${port}`);
  originalLog(`📱 Open http://${localIP}:${port} on your phone to view on mobile!`);
});

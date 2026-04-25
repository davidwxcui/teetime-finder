const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { runAll, stopScraper } = require('./scrape');

const app = express();
const port = 3000;

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

app.post('/api/run', async (req, res) => {
  console.log('🚀 Manual run triggered from UI...');
  res.json({ message: 'Scraper started' });
  try {
    await runAll();
  } catch (err) {
    console.error('❌ Scraper run error:', err.message);
  }
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


app.listen(port, () => {
  originalLog(`🚀 Tee Time Scraper Server running at http://localhost:${port}`);
});

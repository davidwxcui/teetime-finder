# Tee Time Finder

An automated scraper and dashboard for finding tee times at Vancouver and Burnaby golf courses.

## Features

- **Automated Scraping**: Periodically checks for available tee times.
- **Multi-Course Support**: Supports Fraserview, Langara, and Riverway.
- **Notifications**: Sends alerts via Discord Webhooks and Twilio SMS.
- **Web Dashboard**: Modern React interface to monitor activity and adjust settings.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- Chrome/Chromium (for Puppeteer)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/davidwxcui/teetime-finder.git
   cd teetime-finder
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Configuration

Edit `config.json` in the root directory to configure your search preferences and notification settings:

- **twilio**: Set `enabled` to `true` and provide your credentials for SMS alerts.
- **discord**: Set `enabled` to `true` and provide your `webhookUrl` for Discord alerts.
- **search**: 
  - `startTime` / `endTime`: Preferred time range (24h format).
  - `daysToSearch`: How many days into the future to check.
  - `weekendsOnly`: If true, only checks Saturday and Sunday.
  - `golfers`: Preferred number of players (e.g., "4", "2", or "any").

## Usage

### 1. Start the Scraper
The scraper runs in the background and checks for tee times based on your configuration.
```bash
node scrape.js
```

### 2. Start the API Server
The server handles logging and communication between the scraper and the frontend.
```bash
node server.js
```

### 3. Start the Frontend
The dashboard provides a visual interface for the scraper.
```bash
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

## License
ISC

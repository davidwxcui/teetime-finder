const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const alertedTeeTimes = new Set();

function getConfig() {
  const configPath = path.join(__dirname, 'config.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function isMatch(timeStr, config) {
  if (!timeStr) return false;
  
  // Strip all whitespace
  const normalized = timeStr.replace(/\s+/g, '').toUpperCase();
  const match = normalized.match(/(\d+):(\d+)(AM|PM)/i);
  if (!match) return false;

  let [_, hour, minute, meridian] = match;
  hour = parseInt(hour);
  minute = parseInt(minute);

  let hour24 = hour;
  if (meridian === 'PM' && hour !== 12) hour24 += 12;
  if (meridian === 'AM' && hour === 12) hour24 = 0;

  const timeInMinutes = (hour24 * 60) + minute;
  const startInMinutes = config.search.startTime * 60;
  const endInMinutes = config.search.endTime * 60;

  const matched = timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes;
  
  // Debug log to help understand why a match happened or didn't
  if (matched) {
    console.log(`✨ Time check: ${timeStr} (${hour24}:${minute.toString().padStart(2, '0')}) is within ${config.search.startTime}:00-${config.search.endTime}:00`);
  }

  return matched;
}

function isWeekend(dateStr) {
  if (!dateStr) return false;
  const d = dateStr.toLowerCase();
  // Handles formats like "Sunday, April 26" or "Apr 26 (Sun)"
  return d.includes('sat') || d.includes('sun');
}

async function sendText(message, twilioConfig) {
  const twilioClient = twilio(twilioConfig.accountSid, twilioConfig.authToken);
  try {
    await twilioClient.messages.create({
      body: message,
      from: twilioConfig.fromPhone,
      to: twilioConfig.toPhone,
    });
    console.log(`📩 SMS sent: ${message}`);
  } catch (err) {
    if (err.message.includes('limit')) {
        console.error('❌ Twilio Limit Reached: Stopping SMS for now.');
    } else {
        console.error('❌ Failed to send SMS:', err.message);
    }
  }
}

async function bypassBotDetection(page) {
  try {
    const isSuspicious = await page.evaluate(() => {
      return document.body.innerText.includes('Suspicious Activity Detected');
    });

    if (isSuspicious) {
      console.log('🤖 Bot detection detected! Attempting to bypass...');
      const clicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const continueBtn = buttons.find(b => b.innerText.includes('Continue'));
        if (continueBtn) {
          continueBtn.click();
          return true;
        }
        return false;
      });

      if (clicked) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        return true;
      }
    }
  } catch (e) {
    console.error('Error in bypassBotDetection:', e.message);
  }
  return false;
}

let isStopping = false;

function stopScraper() {
  isStopping = true;
}

async function checkTeeTimes(siteName, url, courseFilters = [], config) {
  if (isStopping) return;
  console.log(`\n🔍 Checking ${siteName} at ${new Date().toLocaleTimeString()}...`);
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--window-size=1920,1080'
    ],
  });

  let page;
  try {
    page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    let retries = 3;
    while (retries > 0) {
      if (isStopping) break;
      try {
        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 60000
        });
        break;
      } catch (gotoErr) {
        retries--;
        if (retries === 0) throw gotoErr;
        console.log(`⚠️ Navigation failed on ${siteName}, retrying (${retries} left)...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    if (isStopping) return;
    await new Promise(resolve => setTimeout(resolve, 5000));
    await bypassBotDetection(page);

    const scrapeTeeTimes = () => {
      const dateRaw = document.querySelector('.datetime-group')?.innerText || '';
      const cleanDate = dateRaw.split('\n')[1]?.trim() || '';

      const items = document.querySelectorAll('.teetimeitem-container__item');
      const teeTimes = Array.from(items).map(block => {
        const timeEl = block.querySelector('.teetimetableDateTime');
        const time = timeEl ? timeEl.innerText.replace(/\s+/g, ' ').trim() : '';
        const course =
          block.querySelector('.teetimecourseshort')?.innerText.trim() ||
          block.querySelector('.teetimecourse')?.innerText.trim() || '';
        const golfers = block.querySelector('.teetimeholes')?.innerText.trim() || '';
        return { time, course, golfers };
      });
   
      return { date: cleanDate, teeTimes };
    };

    const results = [];
    const daysToSearch = config.search.daysToSearch || 4;

    for (let i = 0; i < daysToSearch; i++) {
      if (isStopping) break;
      const data = await page.evaluate(scrapeTeeTimes);
      results.push(data);
      console.log(`✅ Scraped ${siteName}: ${data.date} (${data.teeTimes.length} times)`);
      
      if (i < daysToSearch - 1) {
        try {
          const clicked = await page.evaluate(() => {
            const btn = document.querySelector('.right-chevron-button button');
            if (btn) {
              btn.scrollIntoView();
              btn.click();
              return true;
            }
            return false;
          });
          
          if (clicked) {
            await new Promise(resolve => setTimeout(resolve, 4000 + Math.random() * 2000));
          } else {
            console.log(`⚠️ Next day button not found on ${siteName} day ${i+1}`);
            break;
          }
        } catch (clickErr) {
          console.log(`⚠️ Error clicking next day on ${siteName}: ${clickErr.message}`);
          break;
        }
      }
    }

    if (isStopping) return;

    for (const day of results) {
      if (isStopping) break;
      if (config.search.weekendsOnly && !isWeekend(day.date)) {
        console.log(`⏭️ Skipping ${day.date} (Weekday)`);
        continue;
      }

      console.log(`\n📅 Checking matches for ${day.date}:`);
      const matches = day.teeTimes.filter(tt => {
        const timeMatch = isMatch(tt.time, config);
        const courseMatch = courseFilters.length > 0 ? 
            courseFilters.some(filter => tt.course.toLowerCase().includes(filter.toLowerCase())) : 
            true;
        
        if (timeMatch && courseMatch) {
            console.log(`✅ MATCH: ${tt.time} at ${tt.course}`);
        }
        return timeMatch && courseMatch;
      });

      for (const match of matches) {
        if (isStopping) break;
        const key = `${day.date} ${match.time} ${match.course}`;

        if (!alertedTeeTimes.has(key)) {
          const msg = `⛳ Tee time found on ${day.date}:\n${match.time} at ${match.course} (${match.golfers})`;
          await sendText(msg, config.twilio);
          alertedTeeTimes.add(key);
        } else {
          console.log(`🔁 Already alerted for: ${key}`);
        }
      }
    }

    if (results.every(r => r.teeTimes.length === 0)) {
        console.log(`❌ No tee times found on ${siteName}.`);
    }

  } catch (err) {
    console.error(`❌ ${siteName} Scraper error:`, err.message);
    if (page) {
      await page.screenshot({ path: `${siteName.toLowerCase()}_error.png` }).catch(() => {});
    }
  } finally {
    if (isStopping) {
      console.log('🛑 Scraper stopped manually.');
    }
    await browser.close();
  }
}

async function runAll() {
    isStopping = false; // Reset stop flag on new run
    const config = getConfig();
    if (config.search.vancouver.enabled) {
        await checkTeeTimes('Vancouver', 'https://golfvancouver.cps.golf/onlineresweb/', config.search.vancouver.courses, config);
    }
    if (!isStopping && config.search.burnaby.enabled) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        await checkTeeTimes('Burnaby', 'https://golfburnaby.cps.golf/onlineresweb/', config.search.burnaby.courses, config);
    }
}

if (require.main === module) {
    runAll();
    const config = getConfig();
    setInterval(runAll, config.search.intervalMinutes * 60 * 1000);
}

module.exports = { runAll, stopScraper };

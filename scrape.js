const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const twilio = require('twilio');
const fs = require('fs');
const path = require('path');
const https = require('https');

puppeteer.use(StealthPlugin());

const alertedTeeTimes = new Set();

function getConfig() {
  const configPath = path.join(__dirname, 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  // Override with command line arguments
  if (process.argv.includes('--no-sms')) config.twilio.enabled = false;
  if (process.argv.includes('--sms')) config.twilio.enabled = true;
  if (process.argv.includes('--no-discord')) config.discord.enabled = false;
  if (process.argv.includes('--discord')) config.discord.enabled = true;
  
  return config;
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

function golferMatch(scrapedGolfers, requestedGolfers) {
  if (!requestedGolfers || requestedGolfers === 'any') return true;
  if (!scrapedGolfers) return false;

  const target = parseInt(requestedGolfers);
  if (isNaN(target)) return true;

  // Extract all numbers from the scraped string (e.g., "18 HOLES | 2 - 4 GOLFERS")
  const numbers = scrapedGolfers.match(/\d+/g)?.map(Number) || [];
  
  if (numbers.length === 0) return true;

  // If it's a range (e.g., [2, 4])
  if (numbers.length >= 2) {
    // If the string starts with holes (like "18 HOLES | 2 - 4"), the first number is holes.
    // The browser check showed "18 HOLES | 2 - 4 GOLFERS"
    // So we need to be careful.
    const isHolesFirst = scrapedGolfers.toLowerCase().includes('holes');
    const playerNumbers = isHolesFirst ? numbers.slice(1) : numbers;

    if (playerNumbers.length >= 2) {
      const [min, max] = playerNumbers;
      return target >= min && target <= max;
    } else if (playerNumbers.length === 1) {
      return target <= playerNumbers[0];
    }
  } else if (numbers.length === 1) {
    // If only one number, it's either holes or players.
    // If it says "1 GOLFERS", numbers is [1].
    // If it says "18 HOLES", numbers is [18].
    if (scrapedGolfers.toLowerCase().includes('golfer')) {
      return target <= numbers[0];
    }
  }

  return true;
}

function isWeekend(dateStr) {
  if (!dateStr) return false;
  const d = dateStr.toLowerCase();
  // Handles formats like "Sunday, April 26" or "Apr 26 (Sun)"
  return d.includes('sat') || d.includes('sun');
}

function logToCSV(date, time, course, golfers) {
  const csvPath = path.join(__dirname, 'historical_data.csv');
  const now = new Date().toISOString();
  
  // Create file with headers if it doesn't exist
  if (!fs.existsSync(csvPath)) {
    fs.writeFileSync(csvPath, 'scraped_at,tee_time_date,tee_time_slot,course,golfers\n');
  }
  
  // Remove commas to prevent breaking the CSV format
  const safeDate = date ? date.replace(/,/g, '').trim() : '';
  const safeCourse = course ? course.replace(/,/g, '').trim() : '';
  const safeGolfers = golfers ? golfers.replace(/,/g, '').trim() : '';
  
  const line = `${now},${safeDate},${time},${safeCourse},${safeGolfers}\n`;
  
  try {
    fs.appendFileSync(csvPath, line);
  } catch (err) {
    console.error('❌ Failed to write to CSV:', err.message);
  }
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

async function sendDiscord(message, webhookUrl) {
  if (!webhookUrl) return;
  const data = JSON.stringify({ content: message });
  const url = new URL(webhookUrl);
  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve());
    });
    req.on('error', (e) => {
      console.error('❌ Discord notification failed:', e.message);
      reject(e);
    });
    req.write(data);
    req.end();
  });
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
        const golferPreference = config.search.golfers || 'any';
        const golferMatchResult = golferMatch(tt.golfers, golferPreference);
        
        if (timeMatch && courseMatch && golferMatchResult) {
            console.log(`✅ MATCH: ${tt.time} at ${tt.course} (${tt.golfers})`);
        } else if (timeMatch && courseMatch && !golferMatchResult) {
            console.log(`⏭️ Time/Course match but wrong golfer count: ${tt.time} at ${tt.course} (${tt.golfers}) - requested ${golferPreference}`);
        }
        return timeMatch && courseMatch && golferMatchResult;
      });

      if (matches.length === 0) {
        console.log(`ℹ️ No matches found on ${day.date} for your current settings.`);
      }

      for (const match of matches) {
        if (isStopping) break;
        const key = `${day.date} ${match.time} ${match.course}`;

        if (!alertedTeeTimes.has(key)) {
          const msg = `⛳ Tee time found on ${day.date}:\n${match.time} at ${match.course} (${match.golfers})`;
          
          if (config.twilio && config.twilio.enabled && config.twilio.accountSid) {
            await sendText(msg, config.twilio);
            console.log(`📱 SMS notification sent for: ${key}`);
          }
          
          if (config.discord && config.discord.enabled && config.discord.webhookUrl) {
            try {
              await sendDiscord(msg, config.discord.webhookUrl);
              console.log(`📢 Discord notification successfully sent for: ${key}`);
            } catch (err) {
              console.error(`❌ FAILED to send Discord notification: ${err.message}`);
            }
          }
          
          alertedTeeTimes.add(key);
          logToCSV(day.date, match.time, match.course, match.golfers);
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

    console.log('--------------------------------------------------');
    console.log('🚀 STARTING TEE TIME SEARCH');
    console.log(`⏰ Window: ${config.search.startTime}:00 - ${config.search.endTime}:00`);
    console.log(`📅 Search Days: ${config.search.daysToSearch} (${config.search.weekendsOnly ? 'Weekends Only' : 'All Days'})`);
    console.log(`🔄 Interval: Every ${config.search.intervalMinutes} minutes`);
    
    const courses = [];
    if (config.search.vancouver.enabled && config.search.vancouver.courses.length > 0) {
        courses.push(`Vancouver (${config.search.vancouver.courses.join(', ')})`);
    }
    if (config.search.burnaby.enabled && config.search.burnaby.courses.length > 0) {
        courses.push(`Burnaby (${config.search.burnaby.courses.join(', ')})`);
    }
    
    if (courses.length === 0) {
        console.log('⚠️ No courses selected for any site. Skipping search.');
        return;
    }
    
    console.log(`⛳ Courses: ${courses.join(' | ')}`);
    console.log('--------------------------------------------------');

    if (config.search.vancouver.enabled && config.search.vancouver.courses.length > 0) {
        await checkTeeTimes('Vancouver', 'https://golfvancouver.cps.golf/onlineresweb/', config.search.vancouver.courses, config);
        console.log('🏁 Vancouver check finished.');
    } else {
        console.log('⏭️ Skipping Vancouver (No courses selected or disabled)');
    }

    if (!isStopping && config.search.burnaby.enabled && config.search.burnaby.courses.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        await checkTeeTimes('Burnaby', 'https://golfburnaby.cps.golf/onlineresweb/', config.search.burnaby.courses, config);
        console.log('🏁 Burnaby check finished.');
    } else if (!isStopping) {
        console.log('⏭️ Skipping Burnaby (No courses selected or disabled)');
    }
    console.log('✨ All searches completed.');
}

let runCount = 0;
async function start() {
    isStopping = false; 
    while (!isStopping) {
        try {
            runCount++;
            console.log(`\n💎 RUN #${runCount} STARTING...`);
            await runAll();
            
            if (isStopping) break;

            console.log('✅ Scraper loop active. Preparing to sleep/restart...');
            const config = getConfig();
            const safeInterval = Math.max(0, config.search.intervalMinutes || 0);
            
            let sleepTime = safeInterval === 0 ? 5000 : safeInterval * 60 * 1000;
            if (safeInterval === 0) {
                console.log(`🔄 Restarting search in 5 seconds...`);
            } else {
                console.log(`💤 SLEEPING: Next search in ${safeInterval} minute(s)`);
            }

            // Sleep in smaller chunks to allow faster stopping
            const chunk = 1000;
            for (let i = 0; i < sleepTime; i += chunk) {
                if (isStopping) break;
                await new Promise(resolve => setTimeout(resolve, Math.min(chunk, sleepTime - i)));
            }
        } catch (err) {
            if (isStopping) break;
            console.error(`❌ Loop error: ${err.message}. Retrying in 30 seconds...`);
            for (let i = 0; i < 30000; i += 1000) {
                if (isStopping) break;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    console.log('🛑 Scraper loop terminated.');
}

if (require.main === module) {
    start();
}

module.exports = { runAll, start, stopScraper };

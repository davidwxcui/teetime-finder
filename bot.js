const puppeteer = require('puppeteer');
const twilio = require('twilio');

// Twilio config — replace these
const accountSid = '';
const authToken = '';
const twilioClient = twilio(accountSid, authToken);

const fromPhone = '+1';
const toPhone = '+1';

const alertedTeeTimes = new Set();


//change the time here 
function isBefore6PM(timeStr) {
  const [time, meridian] = timeStr.split(' ');
  const [hour, minute] = time.split(':').map(Number);

  let hour24 = hour;
  if (meridian === 'PM' && hour !== 12) hour24 += 12;
  if (meridian === 'AM' && hour === 12) hour24 = 0;

  return hour24 < 18 && hour24 > 11; // between 12:01 PM and 5:59 PM
}

async function sendText(message) {
  try {
    await twilioClient.messages.create({
      body: message,
      from: fromPhone,
      to: toPhone,
    });
    console.log(`📩 SMS sent: ${message}`);
  } catch (err) {
    console.error('❌ Failed to send SMS:', err.message);
  }
}

async function checkTeeTimes() {
  console.log(`\n🔍 Checking at ${new Date().toLocaleTimeString()}...`);
  const browser = await puppeteer.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto('https://golfvancouver.cps.golf/onlineresweb/', {
      waitUntil: 'networkidle0',
    });
    await new Promise(resolve => setTimeout(resolve, 5000)); // wait for dynamic content

    const scrapeTeeTimes = () => {
      const dateRaw = document.querySelector('.datetime-group')?.innerText || '';
      const cleanDate = dateRaw.split('\n')[1]?.trim() || '';

      const items = document.querySelectorAll('.teetimeitem-container__item');
      const teeTimes = Array.from(items).map(block => {
        const time = block.querySelector('.teetimetableDateTime')?.innerText.trim() || '';
        const course =
          block.querySelector('.teetimecourseshort')?.innerText.trim() ||
          block.querySelector('.teetimecourse')?.innerText.trim() || '';
        const golfers = block.querySelector('.teetimeholes')?.innerText.trim() || '';
        return { time, course, golfers };
      });

      return { date: cleanDate, teeTimes };
    };

    const results = [];

    for (let i = 0; i < 4; i++) {
      const data = await page.evaluate(scrapeTeeTimes);
      results.push(data);
      console.log(`✅ Scraped: ${data.date} (${data.teeTimes.length} times)`);

      if (i < 3) {
        await page.click('.right-chevron-button button');
        await new Promise(resolve => setTimeout(resolve, 4000));
      }
    }

    for (const day of results) {
      const match = day.teeTimes.find(tt => isBefore6PM(tt.time));
      if (match) {
        const key = `${day.date} ${match.time} ${match.course}`;

        if (!alertedTeeTimes.has(key)) {
          const msg = `⛳ Tee time before 6PM found on ${day.date}:\n${match.time} at ${match.course} (${match.golfers})`;
          await sendText(msg);
          alertedTeeTimes.add(key);
        } else {
          console.log(`🔁 Already alerted for: ${key}`);
        }

        return; // stop after first match
      }
    }

    console.log('❌ No tee times before 6PM found.');
  } catch (err) {
    console.error('❌ Scraper error:', err.message);
  } finally {
    await browser.close(); // Always closes even on return or error
  }
}

// Run once immediately
checkTeeTimes();

// Check every minute
setInterval(checkTeeTimes, 60 * 1000);

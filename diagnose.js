const puppeteer = require('puppeteer');

async function run() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  
  console.log('Navigating to Vancouver site...');
  try {
    await page.goto('https://golfvancouver.cps.golf/onlineresweb/', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });
    await new Promise(resolve => setTimeout(resolve, 10000));
    await page.screenshot({ path: 'vancouver_debug.png' });
    console.log('Screenshot saved to vancouver_debug.png');
    
    const html = await page.content();
    console.log('HTML length:', html.length);
    // Find some classes
    const classes = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const classSet = new Set();
      allElements.forEach(el => {
        el.classList.forEach(c => classSet.add(c));
      });
      return Array.from(classSet).slice(0, 50);
    });
    console.log('Sample classes found:', classes);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

run();

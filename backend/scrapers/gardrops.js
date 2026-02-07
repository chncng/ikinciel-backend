// ============================================
// GARDROPS SCRAPER (Requires Authentication)
// ============================================

const puppeteer = require('puppeteer');

const scrape = async ({ keyword, minPrice, maxPrice, credentials }) => {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Login if needed
    if (credentials && credentials.username && credentials.password) {
      console.log('🔐 Logging into Gardrops...');
      await page.goto('https://www.gardrops.com/login', { waitUntil: 'networkidle2' });
      await page.type('input[name="email"], input[type="email"]', credentials.username, { delay: 50 });
      await page.type('input[name="password"], input[type="password"]', credentials.password, { delay: 50 });
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
      ]);
      console.log('✅ Logged in to Gardrops');
    }

    let url = `https://www.gardrops.com/ara?q=${encodeURIComponent(keyword)}`;
    console.log(`🔗 Gardrops URL: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('.item, .no-results', { timeout: 10000 });

    const listings = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.item, [class*="item-card"]'));
      return items.map(item => {
        try {
          const titleEl = item.querySelector('[class*="title"]');
          const priceEl = item.querySelector('[class*="price"]');
          const imgEl = item.querySelector('img');
          const linkEl = item.querySelector('a');

          if (!titleEl || !linkEl) return null;

          return {
            title: titleEl.textContent.trim(),
            price: parseInt(priceEl?.textContent.replace(/\D/g, '') || '0'),
            currency: 'TL',
            imageUrl: (imgEl?.src || imgEl?.getAttribute('data-src') || '').replace(/^\/\//, 'https://'),
            listingUrl: linkEl.href.startsWith('http') ? linkEl.href : `https://www.gardrops.com${linkEl.href}`,
            location: null,
            sellerName: null,
            description: titleEl.textContent.trim(),
            postedAt: new Date().toISOString(),
          };
        } catch (error) {
          return null;
        }
      }).filter(Boolean);
    });

    let filteredListings = listings;
    if (minPrice || maxPrice) {
      filteredListings = listings.filter(l => {
        if (minPrice && l.price < minPrice) return false;
        if (maxPrice && l.price > maxPrice) return false;
        return true;
      });
    }

    console.log(`✅ Gardrops: Found ${filteredListings.length} listings`);
    return filteredListings;
  } catch (error) {
    console.error('❌ Gardrops scraping error:', error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
};

module.exports = { scrape };

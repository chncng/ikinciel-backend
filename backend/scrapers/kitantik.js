// ============================================
// KITANTIK SCRAPER (Book marketplace, requires auth)
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

    if (credentials && credentials.username && credentials.password) {
      console.log('🔐 Logging into Kitantik...');
      await page.goto('https://www.kitantik.com/giris', { waitUntil: 'networkidle2' });
      await page.type('input[name="email"]', credentials.username, { delay: 50 });
      await page.type('input[name="password"]', credentials.password, { delay: 50 });
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
      ]);
      console.log('✅ Logged in to Kitantik');
    }

    let url = `https://www.kitantik.com/arama?q=${encodeURIComponent(keyword)}`;
    console.log(`🔗 Kitantik URL: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('.book-item, .product, .no-results', { timeout: 10000 });

    const listings = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.book-item, .product, [class*="book"]'));
      return items.map(item => {
        try {
          const titleEl = item.querySelector('.book-title, [class*="title"]');
          const priceEl = item.querySelector('.book-price, [class*="price"]');
          const imgEl = item.querySelector('img');
          const linkEl = item.querySelector('a');
          const sellerEl = item.querySelector('.seller, [class*="seller"]');

          if (!titleEl || !linkEl) return null;

          return {
            title: titleEl.textContent.trim(),
            price: parseInt(priceEl?.textContent.replace(/\D/g, '') || '0'),
            currency: 'TL',
            imageUrl: (imgEl?.src || imgEl?.getAttribute('data-src') || '').replace(/^\/\//, 'https://'),
            listingUrl: linkEl.href.startsWith('http') ? linkEl.href : `https://www.kitantik.com${linkEl.href}`,
            location: null,
            sellerName: sellerEl?.textContent.trim() || null,
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

    console.log(`✅ Kitantik: Found ${filteredListings.length} listings`);
    return filteredListings;
  } catch (error) {
    console.error('❌ Kitantik scraping error:', error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
};

module.exports = { scrape };

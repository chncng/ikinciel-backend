// ============================================
// DOLAP SCRAPER (Requires Authentication)
// ============================================

const puppeteer = require('puppeteer');

const scrape = async ({ keyword, minPrice, maxPrice, credentials }) => {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Login if credentials provided
    if (credentials && credentials.username && credentials.password) {
      console.log('🔐 Logging into Dolap...');

      await page.goto('https://www.dolap.com/giris', { waitUntil: 'networkidle2' });

      // Fill login form (adjust selectors based on actual Dolap site)
      await page.type('input[name="email"], input[type="email"]', credentials.username, { delay: 50 });
      await page.type('input[name="password"], input[type="password"]', credentials.password, { delay: 50 });

      // Click login button
      await Promise.all([
        page.click('button[type="submit"], .login-button'),
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
      ]);

      console.log('✅ Logged in to Dolap');
    }

    // Navigate to search
    let url = `https://www.dolap.com/arama?q=${encodeURIComponent(keyword)}`;

    console.log(`🔗 Dolap URL: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.waitForSelector('.product-card, .no-results', { timeout: 10000 });

    const noResults = await page.$('.no-results');
    if (noResults) {
      console.log('ℹ️ No results found on Dolap');
      return [];
    }

    const listings = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.product-card, [class*="product"]'));

      return items.map(item => {
        try {
          const titleEl = item.querySelector('.product-title, [class*="title"]');
          const priceEl = item.querySelector('.product-price, [class*="price"]');
          const imgEl = item.querySelector('img');
          const linkEl = item.querySelector('a');
          const sellerEl = item.querySelector('.seller-name, [class*="seller"]');

          if (!titleEl || !linkEl) {
            return null;
          }

          const title = titleEl.textContent.trim();
          const priceText = priceEl?.textContent.trim().replace(/\D/g, '') || '0';
          const price = parseInt(priceText) || 0;
          const imageUrl = imgEl?.src || imgEl?.getAttribute('data-src') || '';
          const listingUrl = linkEl.href.startsWith('http') ? linkEl.href : `https://www.dolap.com${linkEl.href}`;
          const sellerName = sellerEl?.textContent.trim() || null;

          return {
            title,
            price,
            currency: 'TL',
            imageUrl: imageUrl.startsWith('http') ? imageUrl : `https:${imageUrl}`,
            listingUrl,
            location: null,
            sellerName,
            description: title,
            postedAt: new Date().toISOString(),
          };
        } catch (error) {
          console.error('Error parsing Dolap item:', error);
          return null;
        }
      }).filter(item => item !== null);
    });

    let filteredListings = listings;
    if (minPrice || maxPrice) {
      filteredListings = listings.filter(listing => {
        if (minPrice && listing.price < minPrice) return false;
        if (maxPrice && listing.price > maxPrice) return false;
        return true;
      });
    }

    console.log(`✅ Dolap: Found ${filteredListings.length} listings`);
    return filteredListings;

  } catch (error) {
    console.error('❌ Dolap scraping error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = { scrape };

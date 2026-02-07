// ============================================
// LETGO SCRAPER
// ============================================

const puppeteer = require('puppeteer');

const scrape = async ({ keyword, minPrice, maxPrice }) => {
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

    let url = `https://www.letgo.com/tr/search?q=${encodeURIComponent(keyword)}`;

    console.log(`🔗 Letgo URL: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for listings to load
    await page.waitForSelector('.item-card, .no-results', { timeout: 10000 });

    const noResults = await page.$('.no-results');
    if (noResults) {
      console.log('ℹ️ No results found on Letgo');
      return [];
    }

    const listings = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.item-card'));

      return items.map(item => {
        try {
          const titleEl = item.querySelector('.item-title, [class*="title"]');
          const priceEl = item.querySelector('.item-price, [class*="price"]');
          const imgEl = item.querySelector('img');
          const linkEl = item.querySelector('a');
          const locationEl = item.querySelector('.item-location, [class*="location"]');

          if (!titleEl || !linkEl) {
            return null;
          }

          const title = titleEl.textContent.trim();
          const priceText = priceEl?.textContent.trim().replace(/\D/g, '') || '0';
          const price = parseInt(priceText) || 0;
          const imageUrl = imgEl?.src || imgEl?.getAttribute('data-src') || '';
          const listingUrl = linkEl.href.startsWith('http') ? linkEl.href : `https://www.letgo.com${linkEl.href}`;
          const location = locationEl?.textContent.trim() || '';

          return {
            title,
            price,
            currency: 'TL',
            imageUrl: imageUrl.startsWith('http') ? imageUrl : `https:${imageUrl}`,
            listingUrl,
            location,
            sellerName: null,
            description: title,
            postedAt: new Date().toISOString(),
          };
        } catch (error) {
          console.error('Error parsing Letgo item:', error);
          return null;
        }
      }).filter(item => item !== null);
    });

    // Apply price filter if needed
    let filteredListings = listings;
    if (minPrice || maxPrice) {
      filteredListings = listings.filter(listing => {
        if (minPrice && listing.price < minPrice) return false;
        if (maxPrice && listing.price > maxPrice) return false;
        return true;
      });
    }

    console.log(`✅ Letgo: Found ${filteredListings.length} listings`);
    return filteredListings;

  } catch (error) {
    console.error('❌ Letgo scraping error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = { scrape };

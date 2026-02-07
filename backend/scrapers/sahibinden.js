// ============================================
// SAHIBINDEN SCRAPER
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

    // Set user agent to avoid bot detection
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Build URL with filters
    let url = `https://www.sahibinden.com/arama?query=${encodeURIComponent(keyword)}`;

    if (minPrice) {
      url += `&minPrice=${minPrice}`;
    }
    if (maxPrice) {
      url += `&maxPrice=${maxPrice}`;
    }

    console.log(`🔗 Sahibinden URL: ${url}`);

    // Navigate to search page
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for listings to load
    await page.waitForSelector('.searchResultsItem, .no-result', { timeout: 10000 });

    // Check if there are results
    const noResults = await page.$('.no-result');
    if (noResults) {
      console.log('ℹ️ No results found on Sahibinden');
      return [];
    }

    // Extract listings
    const listings = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.searchResultsItem'));

      return items.map(item => {
        try {
          const titleEl = item.querySelector('.classifiedTitle');
          const priceEl = item.querySelector('.searchResultsPriceValue');
          const imgEl = item.querySelector('img[data-src], img[src]');
          const linkEl = item.querySelector('a[href]');
          const locationEl = item.querySelector('.searchResultsLocationValue');
          const dateEl = item.querySelector('.searchResultsDateValue');

          // Skip if essential elements are missing
          if (!titleEl || !linkEl) {
            return null;
          }

          const title = titleEl.textContent.trim();
          const priceText = priceEl?.textContent.trim().replace(/\D/g, '') || '0';
          const price = parseInt(priceText) || 0;
          const imageUrl = imgEl?.getAttribute('data-src') || imgEl?.getAttribute('src') || '';
          const listingUrl = linkEl.href;
          const location = locationEl?.textContent.trim() || '';
          const postedAt = dateEl?.textContent.trim() || '';

          return {
            title,
            price,
            currency: 'TL',
            imageUrl: imageUrl.startsWith('http') ? imageUrl : `https:${imageUrl}`,
            listingUrl,
            location,
            sellerName: null,
            description: title,
            postedAt,
          };
        } catch (error) {
          console.error('Error parsing item:', error);
          return null;
        }
      }).filter(item => item !== null);
    });

    console.log(`✅ Sahibinden: Found ${listings.length} listings`);
    return listings;

  } catch (error) {
    console.error('❌ Sahibinden scraping error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = { scrape };

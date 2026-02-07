// ============================================
// NADIR KITAP SCRAPER (Rare books marketplace)
// ============================================

const puppeteer = require('puppeteer');

const scrape = async ({ keyword, minPrice, maxPrice }) => {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let url = `https://www.nadirkitap.com/ara.php?ara=${encodeURIComponent(keyword)}`;
    console.log(`🔗 Nadir Kitap URL: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('.book-row, .kitap, .no-result', { timeout: 10000 });

    const noResults = await page.$('.no-result');
    if (noResults) {
      console.log('ℹ️ No results found on Nadir Kitap');
      return [];
    }

    const listings = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.book-row, .kitap, [class*="book"]'));
      return items.map(item => {
        try {
          const titleEl = item.querySelector('.book-name, [class*="title"], h3, h4');
          const priceEl = item.querySelector('.book-price, [class*="price"], .fiyat');
          const imgEl = item.querySelector('img');
          const linkEl = item.querySelector('a');
          const sellerEl = item.querySelector('.satici, [class*="seller"]');
          const locationEl = item.querySelector('.sehir, [class*="location"]');

          if (!titleEl || !linkEl) return null;

          return {
            title: titleEl.textContent.trim(),
            price: parseInt(priceEl?.textContent.replace(/\D/g, '') || '0'),
            currency: 'TL',
            imageUrl: (imgEl?.src || imgEl?.getAttribute('data-src') || '').replace(/^\/\//, 'https://'),
            listingUrl: linkEl.href.startsWith('http') ? linkEl.href : `https://www.nadirkitap.com${linkEl.href}`,
            location: locationEl?.textContent.trim() || null,
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

    console.log(`✅ Nadir Kitap: Found ${filteredListings.length} listings`);
    return filteredListings;
  } catch (error) {
    console.error('❌ Nadir Kitap scraping error:', error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
};

module.exports = { scrape };

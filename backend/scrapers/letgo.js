// ============================================
// LETGO SCRAPER (Axios + Cheerio)
// ============================================

const axios = require('axios');
const cheerio = require('cheerio');

const scrape = async ({ keyword, minPrice, maxPrice }) => {
  try {
    let url = `https://www.letgo.com/tr/search?q=${encodeURIComponent(keyword)}`;

    console.log(`🔗 Letgo URL: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);

    const listings = [];
    $('.item-card, [class*="ItemCard"]').each((index, element) => {
      try {
        const $item = $(element);

        const title = $item.find('.item-title, [class*="title"]').first().text().trim();
        const priceText = $item.find('.item-price, [class*="price"]').first().text().trim().replace(/\D/g, '');
        const price = parseInt(priceText) || 0;

        const imgEl = $item.find('img').first();
        let imageUrl = imgEl.attr('src') || imgEl.attr('data-src') || '';
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `https:${imageUrl}`;
        }

        const linkEl = $item.find('a').first();
        const listingUrl = linkEl.attr('href') || '';
        const location = $item.find('.item-location, [class*="location"]').first().text().trim();

        if (!title || !listingUrl) {
          return;
        }

        // Apply price filter
        if (minPrice && price < minPrice) return;
        if (maxPrice && price > maxPrice) return;

        listings.push({
          title,
          price,
          currency: 'TL',
          imageUrl,
          listingUrl: listingUrl.startsWith('http') ? listingUrl : `https://www.letgo.com${listingUrl}`,
          location,
          sellerName: null,
          description: title,
          postedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error parsing Letgo item:', error);
      }
    });

    console.log(`✅ Letgo: Found ${listings.length} listings`);
    return listings;

  } catch (error) {
    console.error('❌ Letgo scraping error:', error.message);
    return [];
  }
};

module.exports = { scrape };

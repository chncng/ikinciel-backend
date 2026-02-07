// ============================================
// SAHIBINDEN SCRAPER (Axios + Cheerio)
// ============================================

const axios = require('axios');
const cheerio = require('cheerio');

const scrape = async ({ keyword, minPrice, maxPrice }) => {
  try {
    // Build URL with filters
    let url = `https://www.sahibinden.com/arama?query=${encodeURIComponent(keyword)}`;

    if (minPrice) {
      url += `&minPrice=${minPrice}`;
    }
    if (maxPrice) {
      url += `&maxPrice=${maxPrice}`;
    }

    console.log(`🔗 Sahibinden URL: ${url}`);

    // Fetch page with headers to avoid bot detection
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 30000,
    });

    // Load HTML into cheerio
    const $ = cheerio.load(response.data);

    // Check if there are results
    const noResults = $('.no-result').length > 0;
    if (noResults) {
      console.log('ℹ️ No results found on Sahibinden');
      return [];
    }

    // Extract listings
    const listings = [];
    $('.searchResultsItem').each((index, element) => {
      try {
        const $item = $(element);

        const titleEl = $item.find('.classifiedTitle');
        const priceEl = $item.find('.searchResultsPriceValue');
        const imgEl = $item.find('img').first();
        const linkEl = $item.find('a[href]').first();
        const locationEl = $item.find('.searchResultsLocationValue');
        const dateEl = $item.find('.searchResultsDateValue');

        // Skip if essential elements are missing
        if (!titleEl.length || !linkEl.length) {
          return;
        }

        const title = titleEl.text().trim();
        const priceText = priceEl.text().trim().replace(/\D/g, '') || '0';
        const price = parseInt(priceText) || 0;

        let imageUrl = imgEl.attr('data-src') || imgEl.attr('src') || '';
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `https:${imageUrl}`;
        }

        const listingUrl = linkEl.attr('href') || '';
        const location = locationEl.text().trim() || '';
        const postedAt = dateEl.text().trim() || '';

        listings.push({
          title,
          price,
          currency: 'TL',
          imageUrl,
          listingUrl: listingUrl.startsWith('http') ? listingUrl : `https://www.sahibinden.com${listingUrl}`,
          location,
          sellerName: null,
          description: title,
          postedAt,
        });
      } catch (error) {
        console.error('Error parsing item:', error);
      }
    });

    console.log(`✅ Sahibinden: Found ${listings.length} listings`);
    return listings;

  } catch (error) {
    console.error('❌ Sahibinden scraping error:', error.message);
    return []; // Return empty array instead of throwing
  }
};

module.exports = { scrape };

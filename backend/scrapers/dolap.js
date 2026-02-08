// ============================================
// DOLAP SCRAPER (Placeholder - Axios + Cheerio)
// ============================================

const axios = require('axios');
const cheerio = require('cheerio');

const scrape = async ({ keyword, minPrice, maxPrice }) => {
  try {
    console.log(`🔗 Dolap scraping: ${keyword}`);
    // Placeholder - returns empty array for now
    // TODO: Implement full scraping logic
    console.log('ℹ️ Dolap scraper not yet implemented');
    return [];
  } catch (error) {
    console.error('❌ Dolap scraping error:', error.message);
    return [];
  }
};

module.exports = { scrape };

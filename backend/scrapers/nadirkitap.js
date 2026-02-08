// ============================================
// NADIR KITAP SCRAPER (Placeholder)
// ============================================

const scrape = async ({ keyword, minPrice, maxPrice }) => {
  try {
    console.log(`🔗 Nadirkitap scraping: ${keyword}`);
    console.log('ℹ️ Nadirkitap scraper not yet implemented');
    return [];
  } catch (error) {
    console.error('❌ Nadirkitap scraping error:', error.message);
    return [];
  }
};

module.exports = { scrape };

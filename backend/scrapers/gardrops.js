// ============================================
// GARDROPS SCRAPER (Placeholder)
// ============================================

const scrape = async ({ keyword, minPrice, maxPrice }) => {
  try {
    console.log(`🔗 Gardrops scraping: ${keyword}`);
    console.log('ℹ️ Gardrops scraper not yet implemented');
    return [];
  } catch (error) {
    console.error('❌ Gardrops scraping error:', error.message);
    return [];
  }
};

module.exports = { scrape };

// ============================================
// 2.EL AVCISI - BACKEND API SERVER
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Scrapers
const sahibindenScraper = require('./scrapers/sahibinden');
const letgoScraper = require('./scrapers/letgo');
const dolapScraper = require('./scrapers/dolap');
const gardropsScraper = require('./scrapers/gardrops');
const kitantikScraper = require('./scrapers/kitantik');
const nadirkitapScraper = require('./scrapers/nadirkitap');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per 15 minutes
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Scrape endpoint
app.post('/api/scrape', async (req, res) => {
  try {
    const { siteName, keyword, minPrice, maxPrice, credentials } = req.body;

    // Validation
    if (!siteName || !keyword) {
      return res.status(400).json({
        error: 'Missing required parameters: siteName and keyword',
      });
    }

    console.log(`🔍 Scraping ${siteName} for "${keyword}"...`);

    let scraper;
    switch (siteName) {
      case 'sahibinden':
        scraper = sahibindenScraper;
        break;
      case 'letgo':
        scraper = letgoScraper;
        break;
      case 'dolap':
        scraper = dolapScraper;
        break;
      case 'gardrops':
        scraper = gardropsScraper;
        break;
      case 'kitantik':
        scraper = kitantikScraper;
        break;
      case 'nadirkitap':
        scraper = nadirkitapScraper;
        break;
      default:
        return res.status(400).json({
          error: `Unknown site: ${siteName}`,
        });
    }

    // Run scraper
    const listings = await scraper.scrape({
      keyword,
      minPrice,
      maxPrice,
      credentials,
    });

    console.log(`✅ Found ${listings.length} listings from ${siteName}`);

    res.json({
      success: true,
      siteName,
      keyword,
      count: listings.length,
      listings,
    });
  } catch (error) {
    console.error('❌ Scraping error:', error);
    res.status(500).json({
      error: 'Scraping failed',
      message: error.message,
    });
  }
});

// Bulk scrape (for multiple sites at once)
app.post('/api/scrape-bulk', async (req, res) => {
  try {
    const { sites, keyword, minPrice, maxPrice } = req.body;

    if (!sites || !Array.isArray(sites) || sites.length === 0 || !keyword) {
      return res.status(400).json({
        error: 'Missing required parameters: sites (array) and keyword',
      });
    }

    console.log(`🔍 Bulk scraping ${sites.length} sites for "${keyword}"...`);

    const results = await Promise.allSettled(
      sites.map(async (siteName) => {
        let scraper;
        switch (siteName) {
          case 'sahibinden':
            scraper = sahibindenScraper;
            break;
          case 'letgo':
            scraper = letgoScraper;
            break;
          case 'dolap':
            scraper = dolapScraper;
            break;
          case 'gardrops':
            scraper = gardropsScraper;
            break;
          case 'kitantik':
            scraper = kitantikScraper;
            break;
          case 'nadirkitap':
            scraper = nadirkitapScraper;
            break;
          default:
            throw new Error(`Unknown site: ${siteName}`);
        }

        const listings = await scraper.scrape({ keyword, minPrice, maxPrice });
        return { siteName, listings };
      })
    );

    const response = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          siteName: result.value.siteName,
          success: true,
          count: result.value.listings.length,
          listings: result.value.listings,
        };
      } else {
        return {
          siteName: sites[index],
          success: false,
          error: result.reason.message,
        };
      }
    });

    const totalListings = response.reduce(
      (sum, r) => sum + (r.listings?.length || 0),
      0
    );

    console.log(`✅ Bulk scraping complete: ${totalListings} total listings`);

    res.json({
      success: true,
      keyword,
      totalListings,
      results: response,
    });
  } catch (error) {
    console.error('❌ Bulk scraping error:', error);
    res.status(500).json({
      error: 'Bulk scraping failed',
      message: error.message,
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📝 API endpoint: http://localhost:${PORT}/api/scrape`);
});

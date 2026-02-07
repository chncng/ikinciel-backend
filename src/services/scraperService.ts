// ============================================
// 2.EL AVCISI - SCRAPER SERVICE
// ============================================

import type { SiteName, SearchKeyword, Listing } from '../types';
import { ListingService, SiteAccountService } from '../database/services';
import { NotificationService } from './notificationService';
import { SITE_CONFIGS } from '../types';
import { API_CONFIG } from '../config';
import { decryptPassword } from '../utils/crypto';

// ============================================
// MOD SEÇİMİ:
// USE_DEMO_MODE = true  → Sahte veriler (backend gerekmez)
// USE_DEMO_MODE = false → Gerçek backend API kullanılır
// ============================================

export const ScraperService = {
  /**
   * Bir anahtar kelime için tüm sitelerde arama yapar
   */
  async searchKeyword(keyword: SearchKeyword): Promise<number> {
    let newListingsCount = 0;

    for (const siteName of keyword.siteNames) {
      try {
        const listings = await this.scrapeSite(siteName, keyword);

        for (const listing of listings) {
          // İlan daha önce eklenmişse atla
          const exists = await ListingService.exists(listing.listingUrl);
          if (exists) {
            continue;
          }

          // Yeni ilan ekle
          await ListingService.create({
            keywordId: keyword.id,
            siteName,
            title: listing.title,
            price: listing.price,
            currency: listing.currency,
            imageUrl: listing.imageUrl,
            listingUrl: listing.listingUrl,
            location: listing.location,
            sellerName: listing.sellerName,
            description: listing.description,
            postedAt: listing.postedAt,
            isNew: true,
            isSeen: false,
            isFavorite: false,
          });

          newListingsCount++;

          // Bildirim gönder
          if (keyword.notificationEnabled) {
            const siteConfig = SITE_CONFIGS.find(s => s.name === siteName);
            await NotificationService.sendNewListingNotification(
              listing as Listing,
              siteConfig?.displayName || siteName
            );
          }
        }
      } catch (error) {
        console.error(`${siteName} tarama hatası:`, error);
      }
    }

    return newListingsCount;
  },

  /**
   * Tüm aktif anahtar kelimeleri tarar
   */
  async searchAllKeywords(keywords: SearchKeyword[]): Promise<{ total: number; bySite: Record<string, number> }> {
    let totalNew = 0;
    const bySite: Record<string, number> = {};

    for (const keyword of keywords) {
      if (!keyword.isActive) {
        continue;
      }

      const newCount = await this.searchKeyword(keyword);
      totalNew += newCount;

      // Site bazında sayaç
      for (const siteName of keyword.siteNames) {
        bySite[siteName] = (bySite[siteName] || 0) + newCount;
      }
    }

    return { total: totalNew, bySite };
  },

  /**
   * Bir sitede anahtar kelime arar
   */
  async scrapeSite(
    siteName: SiteName,
    keyword: SearchKeyword
  ): Promise<Partial<Listing>[]> {
    console.log(`🔍 ${siteName} taranıyor: "${keyword.keyword}"`);

    // DEMO MODE: Sahte veriler döndür
    if (API_CONFIG.USE_DEMO_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (Math.random() > 0.7) {
        const mockListings = this.generateMockListings(siteName, keyword);
        console.log(`✅ ${siteName}: ${mockListings.length} ilan bulundu (DEMO)`);
        return mockListings;
      }

      console.log(`❌ ${siteName}: Yeni ilan bulunamadı (DEMO)`);
      return [];
    }

    // PRODUCTION MODE: Backend API'yi çağır
    try {
      // Eğer site authentication gerektiriyorsa, credentials'ı al
      let credentials = null;
      const siteConfig = SITE_CONFIGS.find(s => s.name === siteName);

      if (siteConfig?.requiresAuth) {
        const accounts = await SiteAccountService.getBySite(siteName);
        if (accounts.length > 0) {
          const account = accounts[0]; // İlk hesabı kullan
          credentials = {
            username: account.username,
            password: await decryptPassword(account.encryptedPassword),
          };
        } else {
          console.warn(`⚠️ ${siteName} authentication gerektirir ama hesap bulunamadı`);
        }
      }

      // Backend API'ye istek at
      const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(API_CONFIG.API_KEY && { 'X-API-Key': API_CONFIG.API_KEY }),
        },
        body: JSON.stringify({
          siteName,
          keyword: keyword.keyword,
          minPrice: keyword.minPrice,
          maxPrice: keyword.maxPrice,
          credentials,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Scraping failed');
      }

      console.log(`✅ ${siteName}: ${data.listings.length} ilan bulundu`);
      return data.listings;

    } catch (error) {
      console.error(`❌ ${siteName} backend scraping error:`, error);
      throw error;
    }
  },

  /**
   * DEMO için sahte ilan verisi üret
   */
  generateMockListings(siteName: SiteName, keyword: SearchKeyword): Partial<Listing>[] {
    const count = Math.floor(Math.random() * 3) + 1; // 1-3 ilan
    const listings: Partial<Listing>[] = [];

    for (let i = 0; i < count; i++) {
      const price = keyword.minPrice
        ? keyword.minPrice + Math.random() * ((keyword.maxPrice || keyword.minPrice * 2) - keyword.minPrice)
        : Math.random() * 1000 + 100;

      // Her site için gerçek arama URL'i oluştur
      const searchUrl = this.generateSearchUrl(siteName, keyword);

      listings.push({
        title: `${keyword.keyword} - ${this.getRandomAdjective()} ${this.getRandomCondition()}`,
        price: Math.round(price),
        currency: 'TL',
        imageUrl: `https://picsum.photos/400/300?random=${Date.now()}-${i}`,
        listingUrl: searchUrl,
        location: this.getRandomCity(),
        sellerName: `Satıcı${Math.floor(Math.random() * 1000)}`,
        description: `${keyword.keyword} ürünü, ${this.getRandomCondition()} durumda.`,
        postedAt: new Date().toISOString(),
      });
    }

    return listings;
  },

  /**
   * Her site için gerçek arama URL'i oluştur
   */
  generateSearchUrl(siteName: SiteName, keyword: SearchKeyword): string {
    const encodedKeyword = encodeURIComponent(keyword.keyword);

    switch (siteName) {
      case 'sahibinden':
        return `https://www.sahibinden.com/arama?query=${encodedKeyword}`;

      case 'letgo':
        return `https://www.letgo.com/tr/search?q=${encodedKeyword}`;

      case 'dolap':
        return `https://www.dolap.com/arama?q=${encodedKeyword}`;

      case 'gardrops':
        return `https://www.gardrops.com/ara?q=${encodedKeyword}`;

      case 'kitantik':
        return `https://www.kitantik.com/arama?q=${encodedKeyword}`;

      case 'nadirkitap':
        return `https://www.nadirkitap.com/ara.php?ara=${encodedKeyword}`;

      default:
        return `https://www.google.com/search?q=${encodedKeyword}`;
    }
  },

  getRandomAdjective(): string {
    const adjectives = ['Orjinal', 'Temiz', 'Az Kullanılmış', 'Kusursuz', 'Garantili', 'Sıfır Ayarında'];
    return adjectives[Math.floor(Math.random() * adjectives.length)];
  },

  getRandomCondition(): string {
    const conditions = ['Sıfır', '2. El', 'İkinci El', 'Tertemiz', 'Hasarsız'];
    return conditions[Math.floor(Math.random() * conditions.length)];
  },

  getRandomCity(): string {
    const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Gaziantep', 'Konya'];
    return cities[Math.floor(Math.random() * cities.length)];
  },
};

// ============================================
// GERÇEK WEB SCRAPING İÇİN:
// ============================================

/*
Backend API Örneği (Node.js + Express + Puppeteer):

// server.js
const express = require('express');
const puppeteer = require('puppeteer');

app.post('/api/scrape', async (req, res) => {
  const { siteName, keyword, minPrice, maxPrice } = req.body;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Site'ye git
  await page.goto(`https://${siteName}.com/search?q=${keyword}`);

  // Login gerekiyorsa
  if (needsAuth) {
    await page.type('#username', username);
    await page.type('#password', password);
    await page.click('#loginBtn');
    await page.waitForNavigation();
  }

  // İlanları topla
  const listings = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.listing-item')).map(item => ({
      title: item.querySelector('.title').textContent,
      price: parseFloat(item.querySelector('.price').textContent),
      imageUrl: item.querySelector('img').src,
      listingUrl: item.querySelector('a').href,
      // ... diğer alanlar
    }));
  });

  await browser.close();
  res.json(listings);
});

// Mobil app'ten çağır:
const response = await fetch('https://your-backend.com/api/scrape', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ siteName, keyword, minPrice, maxPrice })
});
const listings = await response.json();
*/

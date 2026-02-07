// ============================================
// 2.EL AVCISI - DATABASE SCHEMA
// ============================================

import * as SQLite from 'expo-sqlite';

let database: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (database) {
    return database;
  }

  database = await SQLite.openDatabaseAsync('ikinciel_avci.db');
  return database;
};

export const initializeDatabase = async (): Promise<void> => {
  const db = await getDatabase();

  // Site Accounts Table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS site_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      siteName TEXT NOT NULL,
      username TEXT NOT NULL,
      encryptedPassword TEXT NOT NULL,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(siteName, username)
    );
  `);

  // Search Keywords Table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS search_keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT NOT NULL,
      minPrice REAL,
      maxPrice REAL,
      siteNames TEXT NOT NULL,
      isActive INTEGER DEFAULT 1,
      notificationEnabled INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Listings Table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keywordId INTEGER NOT NULL,
      siteName TEXT NOT NULL,
      title TEXT NOT NULL,
      price REAL NOT NULL,
      currency TEXT DEFAULT 'TL',
      imageUrl TEXT,
      listingUrl TEXT NOT NULL UNIQUE,
      location TEXT,
      sellerName TEXT,
      description TEXT,
      postedAt TEXT,
      isNew INTEGER DEFAULT 1,
      isSeen INTEGER DEFAULT 0,
      isFavorite INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (keywordId) REFERENCES search_keywords(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for better performance
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_listings_keyword ON listings(keywordId);
    CREATE INDEX IF NOT EXISTS idx_listings_site ON listings(siteName);
    CREATE INDEX IF NOT EXISTS idx_listings_new ON listings(isNew);
    CREATE INDEX IF NOT EXISTS idx_keywords_active ON search_keywords(isActive);
  `);

  console.log('✅ Veritabanı başlatıldı');
};

export const resetDatabase = async (): Promise<void> => {
  const db = await getDatabase();

  await db.execAsync(`DROP TABLE IF EXISTS site_accounts`);
  await db.execAsync(`DROP TABLE IF EXISTS search_keywords`);
  await db.execAsync(`DROP TABLE IF EXISTS listings`);

  await initializeDatabase();
  console.log('✅ Veritabanı sıfırlandı');
};

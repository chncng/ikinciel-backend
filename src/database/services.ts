// ============================================
// 2.EL AVCISI - DATABASE SERVICES
// ============================================

import { getDatabase } from './schema';
import type { SiteAccount, SearchKeyword, Listing, SiteName } from '../types';

// ============================================
// SITE ACCOUNTS SERVICE
// ============================================

export const SiteAccountService = {
  async create(account: Omit<SiteAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO site_accounts (siteName, username, encryptedPassword, isActive) VALUES (?, ?, ?, ?)',
      [account.siteName, account.username, account.encryptedPassword, account.isActive ? 1 : 0]
    );
    return result.lastInsertRowId;
  },

  async getAll(): Promise<SiteAccount[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<SiteAccount>('SELECT * FROM site_accounts ORDER BY createdAt DESC');
    return rows;
  },

  async getBySite(siteName: SiteName): Promise<SiteAccount | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<SiteAccount>(
      'SELECT * FROM site_accounts WHERE siteName = ? AND isActive = 1',
      [siteName]
    );
    return row || null;
  },

  async update(id: number, account: Partial<SiteAccount>): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (account.username !== undefined) {
      fields.push('username = ?');
      values.push(account.username);
    }
    if (account.encryptedPassword !== undefined) {
      fields.push('encryptedPassword = ?');
      values.push(account.encryptedPassword);
    }
    if (account.isActive !== undefined) {
      fields.push('isActive = ?');
      values.push(account.isActive ? 1 : 0);
    }

    fields.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);

    await db.runAsync(
      `UPDATE site_accounts SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM site_accounts WHERE id = ?', [id]);
  },
};

// ============================================
// SEARCH KEYWORDS SERVICE
// ============================================

export const SearchKeywordService = {
  async create(keyword: Omit<SearchKeyword, 'id' | 'createdAt'>): Promise<number> {
    const db = await getDatabase();
    const siteNamesJson = JSON.stringify(keyword.siteNames);
    const result = await db.runAsync(
      'INSERT INTO search_keywords (keyword, minPrice, maxPrice, siteNames, isActive, notificationEnabled) VALUES (?, ?, ?, ?, ?, ?)',
      [
        keyword.keyword,
        keyword.minPrice || null,
        keyword.maxPrice || null,
        siteNamesJson,
        keyword.isActive ? 1 : 0,
        keyword.notificationEnabled ? 1 : 0,
      ]
    );
    return result.lastInsertRowId;
  },

  async getAll(): Promise<SearchKeyword[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>('SELECT * FROM search_keywords ORDER BY createdAt DESC');
    return rows.map(row => ({
      ...row,
      siteNames: JSON.parse(row.siteNames),
      isActive: row.isActive === 1,
      notificationEnabled: row.notificationEnabled === 1,
    }));
  },

  async getActive(): Promise<SearchKeyword[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>('SELECT * FROM search_keywords WHERE isActive = 1');
    return rows.map(row => ({
      ...row,
      siteNames: JSON.parse(row.siteNames),
      isActive: true,
      notificationEnabled: row.notificationEnabled === 1,
    }));
  },

  async update(id: number, keyword: Partial<SearchKeyword>): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (keyword.keyword !== undefined) {
      fields.push('keyword = ?');
      values.push(keyword.keyword);
    }
    if (keyword.minPrice !== undefined) {
      fields.push('minPrice = ?');
      values.push(keyword.minPrice);
    }
    if (keyword.maxPrice !== undefined) {
      fields.push('maxPrice = ?');
      values.push(keyword.maxPrice);
    }
    if (keyword.siteNames !== undefined) {
      fields.push('siteNames = ?');
      values.push(JSON.stringify(keyword.siteNames));
    }
    if (keyword.isActive !== undefined) {
      fields.push('isActive = ?');
      values.push(keyword.isActive ? 1 : 0);
    }
    if (keyword.notificationEnabled !== undefined) {
      fields.push('notificationEnabled = ?');
      values.push(keyword.notificationEnabled ? 1 : 0);
    }

    values.push(id);

    await db.runAsync(
      `UPDATE search_keywords SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM search_keywords WHERE id = ?', [id]);
  },
};

// ============================================
// LISTINGS SERVICE
// ============================================

export const ListingService = {
  async create(listing: Omit<Listing, 'id' | 'createdAt'>): Promise<number> {
    const db = await getDatabase();
    const result = await db.runAsync(
      `INSERT INTO listings (
        keywordId, siteName, title, price, currency, imageUrl, listingUrl,
        location, sellerName, description, postedAt, isNew, isSeen, isFavorite
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        listing.keywordId,
        listing.siteName,
        listing.title,
        listing.price,
        listing.currency || 'TL',
        listing.imageUrl || null,
        listing.listingUrl,
        listing.location || null,
        listing.sellerName || null,
        listing.description || null,
        listing.postedAt || null,
        listing.isNew ? 1 : 0,
        listing.isSeen ? 1 : 0,
        listing.isFavorite ? 1 : 0,
      ]
    );
    return result.lastInsertRowId;
  },

  async getAll(): Promise<Listing[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>('SELECT * FROM listings ORDER BY createdAt DESC');
    return rows.map(row => ({
      ...row,
      isNew: row.isNew === 1,
      isSeen: row.isSeen === 1,
      isFavorite: row.isFavorite === 1,
    }));
  },

  async getByKeyword(keywordId: number): Promise<Listing[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM listings WHERE keywordId = ? ORDER BY createdAt DESC',
      [keywordId]
    );
    return rows.map(row => ({
      ...row,
      isNew: row.isNew === 1,
      isSeen: row.isSeen === 1,
      isFavorite: row.isFavorite === 1,
    }));
  },

  async getNew(): Promise<Listing[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM listings WHERE isNew = 1 ORDER BY createdAt DESC'
    );
    return rows.map(row => ({
      ...row,
      isNew: true,
      isSeen: row.isSeen === 1,
      isFavorite: row.isFavorite === 1,
    }));
  },

  async getFavorites(): Promise<Listing[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM listings WHERE isFavorite = 1 ORDER BY createdAt DESC'
    );
    return rows.map(row => ({
      ...row,
      isNew: row.isNew === 1,
      isSeen: row.isSeen === 1,
      isFavorite: true,
    }));
  },

  async markAsSeen(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('UPDATE listings SET isSeen = 1, isNew = 0 WHERE id = ?', [id]);
  },

  async toggleFavorite(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE listings SET isFavorite = CASE WHEN isFavorite = 1 THEN 0 ELSE 1 END WHERE id = ?',
      [id]
    );
  },

  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM listings WHERE id = ?', [id]);
  },

  async exists(listingUrl: string): Promise<boolean> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM listings WHERE listingUrl = ?',
      [listingUrl]
    );
    return (row?.count || 0) > 0;
  },
};

// ============================================
// 2.EL AVCISI - TYPE DEFINITIONS
// ============================================

export type SiteName = 'sahibinden' | 'letgo' | 'dolap' | 'gardrops' | 'kitantik' | 'nadirkitap';

export interface SiteAccount {
  id: number;
  siteName: SiteName;
  username: string;
  encryptedPassword: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SearchKeyword {
  id: number;
  keyword: string;
  minPrice?: number;
  maxPrice?: number;
  siteNames: SiteName[]; // Hangi sitelerde aranacak
  isActive: boolean;
  createdAt: string;
  notificationEnabled: boolean;
}

export interface Listing {
  id: number;
  keywordId: number;
  siteName: SiteName;
  title: string;
  price: number;
  currency: string;
  imageUrl?: string;
  listingUrl: string;
  location?: string;
  sellerName?: string;
  description?: string;
  postedAt?: string;
  isNew: boolean;
  isSeen: boolean;
  isFavorite: boolean;
  createdAt: string;
}

export interface SiteConfig {
  name: SiteName;
  displayName: string;
  icon: string;
  color: string;
  baseUrl: string;
  requiresAuth: boolean;
}

export const SITE_CONFIGS: SiteConfig[] = [
  {
    name: 'sahibinden',
    displayName: 'Sahibinden',
    icon: '🏠',
    color: '#FFD600',
    baseUrl: 'https://www.sahibinden.com',
    requiresAuth: false,
  },
  {
    name: 'letgo',
    displayName: 'Letgo',
    icon: '📦',
    color: '#FF5722',
    baseUrl: 'https://www.letgo.com.tr',
    requiresAuth: false,
  },
  {
    name: 'dolap',
    displayName: 'Dolap',
    icon: '👗',
    color: '#E91E63',
    baseUrl: 'https://www.dolap.com',
    requiresAuth: true,
  },
  {
    name: 'gardrops',
    displayName: 'Gardrops',
    icon: '👔',
    color: '#9C27B0',
    baseUrl: 'https://www.gardrops.com',
    requiresAuth: true,
  },
  {
    name: 'kitantik',
    displayName: 'Kitantik',
    icon: '📚',
    color: '#3F51B5',
    baseUrl: 'https://www.kitantik.com',
    requiresAuth: true,
  },
  {
    name: 'nadirkitap',
    displayName: 'Nadir Kitap',
    icon: '📖',
    color: '#00BCD4',
    baseUrl: 'https://www.nadirkitap.com',
    requiresAuth: false,
  },
];

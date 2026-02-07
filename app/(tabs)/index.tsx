// ============================================
// 2.EL AVCISI - İLANLAR EKRANI
// ============================================

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Linking,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { ListingService } from '../../src/database/services';
import { SITE_CONFIGS } from '../../src/types';
import type { Listing, SiteName } from '../../src/types';

type DateFilter = 'all' | 'today' | '3days' | 'week' | 'month';
type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high';

export default function ListingsScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [filter, setFilter] = useState<'all' | 'new' | 'favorites'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [selectedSites, setSelectedSites] = useState<SiteName[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const loadListings = useCallback(async () => {
    try {
      let data: Listing[];

      if (filter === 'new') {
        data = await ListingService.getNew();
      } else if (filter === 'favorites') {
        data = await ListingService.getFavorites();
      } else {
        data = await ListingService.getAll();
      }

      setListings(data);
    } catch (error) {
      console.error('İlanlar yüklenemedi:', error);
    } finally {
      setRefreshing(false);
    }
  }, [filter]);

  // Filtre ve arama uygula
  useEffect(() => {
    let result = [...listings];

    // Arama filtresi
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        listing =>
          listing.title.toLowerCase().includes(query) ||
          listing.description?.toLowerCase().includes(query)
      );
    }

    // Tarih filtresi
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case '3days':
          filterDate.setDate(now.getDate() - 3);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      result = result.filter(listing => new Date(listing.createdAt) >= filterDate);
    }

    // Site filtresi
    if (selectedSites.length > 0) {
      result = result.filter(listing => selectedSites.includes(listing.siteName));
    }

    // Sıralama
    result.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        default:
          return 0;
      }
    });

    setFilteredListings(result);
  }, [listings, searchQuery, dateFilter, selectedSites, sortOption]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const onRefresh = () => {
    setRefreshing(true);
    loadListings();
  };

  const handleListingPress = async (listing: Listing) => {
    await ListingService.markAsSeen(listing.id);
    Linking.openURL(listing.listingUrl);
    loadListings();
  };

  const handleFavoriteToggle = async (listing: Listing) => {
    await ListingService.toggleFavorite(listing.id);
    loadListings();
  };

  const getSiteIcon = (siteName: string) => {
    const config = SITE_CONFIGS.find(s => s.name === siteName);
    return config?.icon || '📦';
  };

  const renderListing = ({ item }: { item: Listing }) => (
    <TouchableOpacity
      style={[styles.listingCard, item.isNew && styles.listingCardNew]}
      onPress={() => handleListingPress(item)}
    >
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.listingImage} />
      )}

      <View style={styles.listingContent}>
        <View style={styles.listingHeader}>
          <View style={styles.siteTag}>
            <Text style={styles.siteIcon}>{getSiteIcon(item.siteName)}</Text>
          </View>
          {item.isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>YENİ</Text>
            </View>
          )}
        </View>

        <Text style={styles.listingTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.listingMeta}>
          <Text style={styles.listingPrice}>
            {item.price.toLocaleString('tr-TR')} {item.currency}
          </Text>
          {item.location && (
            <Text style={styles.listingLocation} numberOfLines={1}>
              📍 {item.location}
            </Text>
          )}
        </View>

        {item.sellerName && (
          <Text style={styles.listingSeller} numberOfLines={1}>
            👤 {item.sellerName}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.favoriteBtn}
        onPress={() => handleFavoriteToggle(item)}
      >
        <Text style={styles.favoriteBtnText}>
          {item.isFavorite ? '❤️' : '🤍'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const handleToggleSiteFilter = (siteName: SiteName) => {
    if (selectedSites.includes(siteName)) {
      setSelectedSites(selectedSites.filter(s => s !== siteName));
    } else {
      setSelectedSites([...selectedSites, siteName]);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setSelectedSites([]);
    setSortOption('newest');
  };

  const hasActiveFilters = searchQuery || dateFilter !== 'all' || selectedSites.length > 0 || sortOption !== 'newest';
  const newCount = listings.filter(l => l.isNew).length;

  return (
    <View style={styles.container}>
      {/* Ana filtre butonları */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterBtnText, filter === 'all' && styles.filterBtnTextActive]}>
            Tümü ({listings.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filter === 'new' && styles.filterBtnActive]}
          onPress={() => setFilter('new')}
        >
          <Text style={[styles.filterBtnText, filter === 'new' && styles.filterBtnTextActive]}>
            Yeni ({newCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filter === 'favorites' && styles.filterBtnActive]}
          onPress={() => setFilter('favorites')}
        >
          <Text style={[styles.filterBtnText, filter === 'favorites' && styles.filterBtnTextActive]}>
            ⭐ Favoriler
          </Text>
        </TouchableOpacity>
      </View>

      {/* Arama ve gelişmiş filtre */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="İlan ara..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={[styles.filterIconBtn, hasActiveFilters && styles.filterIconBtnActive]}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterIconText}>🔧</Text>
          {hasActiveFilters && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Aktif filtre göstergeleri */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dateFilter !== 'all' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  📅 {dateFilter === 'today' ? 'Bugün' : dateFilter === '3days' ? '3 gün' : dateFilter === 'week' ? '1 hafta' : '1 ay'}
                </Text>
              </View>
            )}
            {selectedSites.map(site => (
              <View key={site} style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  {SITE_CONFIGS.find(s => s.name === site)?.icon} {SITE_CONFIGS.find(s => s.name === site)?.displayName}
                </Text>
              </View>
            ))}
            {sortOption !== 'newest' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  ⬆️ {sortOption === 'oldest' ? 'En eski' : sortOption === 'price_low' ? 'Ucuz' : 'Pahalı'}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.clearFilterBtn} onPress={clearFilters}>
              <Text style={styles.clearFilterText}>✕ Temizle</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {filteredListings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>
            {filter === 'favorites' ? '⭐' : '🔍'}
          </Text>
          <Text style={styles.emptyText}>
            {filter === 'favorites'
              ? 'Henüz favori ilan yok'
              : 'Henüz ilan bulunamadı'
            }
          </Text>
          <Text style={styles.emptySubtext}>
            Arama ekranından anahtar kelime ekleyin
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredListings}
          renderItem={renderListing}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Gelişmiş Filtre Modalı */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtreler ve Sıralama</Text>

            {/* Tarih Filtresi */}
            <Text style={styles.sectionTitle}>📅 Tarih:</Text>
            <View style={styles.optionsGrid}>
              {[
                { value: 'all', label: 'Tümü' },
                { value: 'today', label: 'Bugün' },
                { value: '3days', label: 'Son 3 Gün' },
                { value: 'week', label: 'Son Hafta' },
                { value: 'month', label: 'Son Ay' },
              ].map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionBtn,
                    dateFilter === option.value && styles.optionBtnActive,
                  ]}
                  onPress={() => setDateFilter(option.value as DateFilter)}
                >
                  <Text style={[
                    styles.optionBtnText,
                    dateFilter === option.value && styles.optionBtnTextActive,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Site Filtresi */}
            <Text style={styles.sectionTitle}>🌐 Siteler:</Text>
            <View style={styles.optionsGrid}>
              {SITE_CONFIGS.map(site => (
                <TouchableOpacity
                  key={site.name}
                  style={[
                    styles.optionBtn,
                    selectedSites.includes(site.name) && styles.optionBtnActive,
                  ]}
                  onPress={() => handleToggleSiteFilter(site.name)}
                >
                  <Text style={[
                    styles.optionBtnText,
                    selectedSites.includes(site.name) && styles.optionBtnTextActive,
                  ]}>
                    {site.icon} {site.displayName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sıralama */}
            <Text style={styles.sectionTitle}>⬆️ Sırala:</Text>
            <View style={styles.optionsGrid}>
              {[
                { value: 'newest', label: 'En Yeni' },
                { value: 'oldest', label: 'En Eski' },
                { value: 'price_low', label: 'Fiyat (Düşük)' },
                { value: 'price_high', label: 'Fiyat (Yüksek)' },
              ].map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionBtn,
                    sortOption === option.value && styles.optionBtnActive,
                  ]}
                  onPress={() => setSortOption(option.value as SortOption)}
                >
                  <Text style={[
                    styles.optionBtnText,
                    sortOption === option.value && styles.optionBtnTextActive,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={clearFilters}
              >
                <Text style={styles.modalBtnSecondaryText}>Temizle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.modalBtnPrimaryText}>Uygula</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1e',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#2d2d44',
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#4CAF50',
  },
  filterBtnText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 12,
  },
  listingCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  listingCardNew: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  listingImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#2d2d44',
  },
  listingContent: {
    padding: 12,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  siteTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  siteIcon: {
    fontSize: 18,
  },
  newBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
  },
  listingMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listingPrice: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listingLocation: {
    color: '#888',
    fontSize: 12,
    flex: 1,
    marginLeft: 8,
  },
  listingSeller: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBtnText: {
    fontSize: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#1a1a2e',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#2d2d44',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 15,
  },
  filterIconBtn: {
    backgroundColor: '#2d2d44',
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterIconBtnActive: {
    backgroundColor: '#4CAF50',
  },
  filterIconText: {
    fontSize: 20,
  },
  filterDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5722',
  },
  activeFiltersContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: '#1a1a2e',
  },
  activeFilterChip: {
    backgroundColor: '#2d2d44',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterText: {
    color: '#fff',
    fontSize: 12,
  },
  clearFilterBtn: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearFilterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionBtn: {
    backgroundColor: '#2d2d44',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionBtnActive: {
    backgroundColor: '#4CAF50',
  },
  optionBtnText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  optionBtnTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalBtnSecondary: {
    flex: 1,
    backgroundColor: '#2d2d44',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnSecondaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBtnPrimary: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

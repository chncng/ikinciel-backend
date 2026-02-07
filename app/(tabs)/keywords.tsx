// ============================================
// 2.EL AVCISI - ANAHTAR KELİMELER EKRANI
// ============================================

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { SearchKeywordService } from '../../src/database/services';
import { SITE_CONFIGS } from '../../src/types';
import type { SearchKeyword, SiteName } from '../../src/types';

export default function KeywordsScreen() {
  const [keywords, setKeywords] = useState<SearchKeyword[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedSites, setSelectedSites] = useState<SiteName[]>([]);

  const loadKeywords = useCallback(async () => {
    try {
      const data = await SearchKeywordService.getAll();
      setKeywords(data);
    } catch (error) {
      console.error('Anahtar kelimeler yüklenemedi:', error);
    }
  }, []);

  useEffect(() => {
    loadKeywords();
  }, [loadKeywords]);

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) {
      Alert.alert('Hata', 'Anahtar kelime giriniz');
      return;
    }

    if (selectedSites.length === 0) {
      Alert.alert('Hata', 'En az bir site seçmelisiniz');
      return;
    }

    try {
      await SearchKeywordService.create({
        keyword: newKeyword.trim(),
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        siteNames: selectedSites,
        isActive: true,
        notificationEnabled: true,
      });

      Alert.alert('Başarılı', 'Anahtar kelime eklendi');
      setNewKeyword('');
      setMinPrice('');
      setMaxPrice('');
      setSelectedSites([]);
      setShowAddModal(false);
      loadKeywords();
    } catch (error) {
      console.error('Keyword creation error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Hata', `Anahtar kelime eklenirken hata oluştu: ${errorMessage}`);
    }
  };

  const handleToggleSite = (siteName: SiteName) => {
    if (selectedSites.includes(siteName)) {
      setSelectedSites(selectedSites.filter(s => s !== siteName));
    } else {
      setSelectedSites([...selectedSites, siteName]);
    }
  };

  const handleToggleActive = async (keyword: SearchKeyword) => {
    try {
      await SearchKeywordService.update(keyword.id, {
        isActive: !keyword.isActive,
      });
      loadKeywords();
    } catch (error) {
      console.error('Toggle active error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Hata', `Güncelleme başarısız: ${errorMessage}`);
    }
  };

  const handleDelete = (keyword: SearchKeyword) => {
    Alert.alert(
      'Sil',
      `"${keyword.keyword}" anahtar kelimesini silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await SearchKeywordService.delete(keyword.id);
              loadKeywords();
            } catch (error) {
              console.error('Delete keyword error:', error);
              const errorMessage = error instanceof Error ? error.message : String(error);
              Alert.alert('Hata', `Silme başarısız: ${errorMessage}`);
            }
          },
        },
      ]
    );
  };

  const renderKeyword = ({ item }: { item: SearchKeyword }) => (
    <View style={[styles.keywordCard, !item.isActive && styles.keywordCardInactive]}>
      <View style={styles.keywordHeader}>
        <Text style={styles.keywordTitle}>{item.keyword}</Text>
        <TouchableOpacity
          style={[styles.toggleBtn, item.isActive && styles.toggleBtnActive]}
          onPress={() => handleToggleActive(item)}
        >
          <Text style={styles.toggleBtnText}>
            {item.isActive ? '✓' : '✕'}
          </Text>
        </TouchableOpacity>
      </View>

      {(item.minPrice || item.maxPrice) && (
        <Text style={styles.keywordPrice}>
          Fiyat: {item.minPrice || 0} - {item.maxPrice || '∞'} TL
        </Text>
      )}

      <View style={styles.sitesContainer}>
        {item.siteNames.map(siteName => {
          const config = SITE_CONFIGS.find(s => s.name === siteName);
          return (
            <View key={siteName} style={styles.siteChip}>
              <Text style={styles.siteChipText}>
                {config?.icon} {config?.displayName}
              </Text>
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item)}
      >
        <Text style={styles.deleteBtnText}>🗑️ Sil</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addBtnText}>➕ Yeni Arama Ekle</Text>
        </TouchableOpacity>
      </View>

      {keywords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>Henüz arama kaydedilmedi</Text>
          <Text style={styles.emptySubtext}>
            Aramak istediğiniz ürünleri ekleyin
          </Text>
        </View>
      ) : (
        <FlatList
          data={keywords}
          renderItem={renderKeyword}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yeni Arama</Text>

            <TextInput
              style={styles.input}
              placeholder="Anahtar kelime (örn: iPhone 13)"
              placeholderTextColor="#888"
              value={newKeyword}
              onChangeText={setNewKeyword}
            />

            <View style={styles.priceRow}>
              <TextInput
                style={[styles.input, styles.inputHalf]}
                placeholder="Min fiyat"
                placeholderTextColor="#888"
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.inputHalf]}
                placeholder="Max fiyat"
                placeholderTextColor="#888"
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.sectionTitle}>Siteler:</Text>
            <ScrollView style={styles.sitesScroll}>
              {SITE_CONFIGS.map(site => (
                <TouchableOpacity
                  key={site.name}
                  style={[
                    styles.siteOption,
                    selectedSites.includes(site.name) && styles.siteOptionSelected,
                  ]}
                  onPress={() => handleToggleSite(site.name)}
                >
                  <Text style={styles.siteOptionIcon}>{site.icon}</Text>
                  <Text style={styles.siteOptionText}>{site.displayName}</Text>
                  {selectedSites.includes(site.name) && (
                    <Text style={styles.siteOptionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => {
                  setShowAddModal(false);
                  setNewKeyword('');
                  setMinPrice('');
                  setMaxPrice('');
                  setSelectedSites([]);
                }}
              >
                <Text style={styles.modalBtnCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnSave}
                onPress={handleAddKeyword}
              >
                <Text style={styles.modalBtnSaveText}>Kaydet</Text>
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
  header: {
    padding: 12,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  addBtn: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 12,
  },
  keywordCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  keywordCardInactive: {
    opacity: 0.5,
  },
  keywordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  keywordTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  toggleBtn: {
    backgroundColor: '#F44336',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#4CAF50',
  },
  toggleBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  keywordPrice: {
    color: '#4CAF50',
    fontSize: 14,
    marginBottom: 12,
  },
  sitesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  siteChip: {
    backgroundColor: '#2d2d44',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  siteChipText: {
    color: '#fff',
    fontSize: 12,
  },
  deleteBtn: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#2d2d44',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3d3d54',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 12,
  },
  sitesScroll: {
    maxHeight: 200,
    marginBottom: 20,
  },
  siteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d44',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  siteOptionSelected: {
    backgroundColor: '#4CAF50',
  },
  siteOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  siteOptionText: {
    color: '#fff',
    fontSize: 15,
    flex: 1,
  },
  siteOptionCheck: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtnCancel: {
    flex: 1,
    backgroundColor: '#2d2d44',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBtnSave: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

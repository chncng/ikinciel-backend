// ============================================
// 2.EL AVCISI - SİTELER EKRANI
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
} from 'react-native';
import { SiteAccountService } from '../../src/database/services';
import { encryptPassword } from '../../src/utils/crypto';
import { SITE_CONFIGS } from '../../src/types';
import type { SiteAccount, SiteName } from '../../src/types';

export default function SitesScreen() {
  const [accounts, setAccounts] = useState<SiteAccount[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState<SiteName | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const loadAccounts = useCallback(async () => {
    try {
      const data = await SiteAccountService.getAll();
      setAccounts(data);
    } catch (error) {
      console.error('Hesaplar yüklenemedi:', error);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleAddAccount = async () => {
    if (!selectedSite) {
      Alert.alert('Hata', 'Site seçiniz');
      return;
    }
    if (!username.trim() || !password.trim()) {
      Alert.alert('Hata', 'Kullanıcı adı ve şifre giriniz');
      return;
    }

    try {
      const encryptedPw = await encryptPassword(password);
      await SiteAccountService.create({
        siteName: selectedSite,
        username: username.trim(),
        encryptedPassword: encryptedPw,
        isActive: true,
      });

      Alert.alert('Başarılı', 'Hesap eklendi');
      setUsername('');
      setPassword('');
      setSelectedSite(null);
      setShowAddModal(false);
      loadAccounts();
    } catch {
      Alert.alert('Hata', 'Hesap eklenirken hata oluştu');
    }
  };

  const handleDeleteAccount = (account: SiteAccount) => {
    Alert.alert(
      'Sil',
      `${account.siteName} hesabını silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await SiteAccountService.delete(account.id);
              loadAccounts();
            } catch {
              Alert.alert('Hata', 'Silme başarısız');
            }
          },
        },
      ]
    );
  };

  const getSiteConfig = (siteName: SiteName) => {
    return SITE_CONFIGS.find(s => s.name === siteName)!;
  };

  const renderAccount = ({ item }: { item: SiteAccount }) => {
    const config = getSiteConfig(item.siteName as SiteName);

    return (
      <View style={styles.accountCard}>
        <View style={styles.accountHeader}>
          <Text style={styles.siteIcon}>{config.icon}</Text>
          <View style={styles.accountInfo}>
            <Text style={styles.siteName}>{config.displayName}</Text>
            <Text style={styles.username}>👤 {item.username}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDeleteAccount(item)}
        >
          <Text style={styles.deleteBtnText}>🗑️ Sil</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSiteOption = (siteName: SiteName) => {
    const config = getSiteConfig(siteName);
    const hasAccount = accounts.some(a => a.siteName === siteName);

    return (
      <TouchableOpacity
        key={siteName}
        style={[
          styles.siteOption,
          selectedSite === siteName && styles.siteOptionSelected,
          hasAccount && styles.siteOptionDisabled,
        ]}
        onPress={() => !hasAccount && setSelectedSite(siteName)}
        disabled={hasAccount}
      >
        <Text style={styles.siteOptionIcon}>{config.icon}</Text>
        <Text style={styles.siteOptionText}>{config.displayName}</Text>
        {hasAccount && (
          <Text style={styles.siteOptionBadge}>Ekli</Text>
        )}
        {selectedSite === siteName && (
          <Text style={styles.siteOptionCheck}>✓</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addBtnText}>➕ Site Hesabı Ekle</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={styles.infoText}>
          Giriş gerektiren siteler için hesap bilgilerinizi ekleyin. Şifreler güvenli şekilde saklanır.
        </Text>
      </View>

      {accounts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🌐</Text>
          <Text style={styles.emptyText}>Henüz hesap eklenmedi</Text>
          <Text style={styles.emptySubtext}>
            Giriş gerektiren siteler için hesap ekleyin
          </Text>
        </View>
      ) : (
        <FlatList
          data={accounts}
          renderItem={renderAccount}
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
            <Text style={styles.modalTitle}>Site Hesabı Ekle</Text>

            <Text style={styles.sectionTitle}>Site seçin:</Text>
            {SITE_CONFIGS.filter(s => s.requiresAuth).map(s =>
              renderSiteOption(s.name)
            )}

            {selectedSite && (
              <>
                <Text style={styles.sectionTitle}>Hesap bilgileri:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Kullanıcı adı"
                  placeholderTextColor="#888"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Şifre"
                  placeholderTextColor="#888"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => {
                  setShowAddModal(false);
                  setUsername('');
                  setPassword('');
                  setSelectedSite(null);
                }}
              >
                <Text style={styles.modalBtnCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnSave}
                onPress={handleAddAccount}
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    padding: 12,
    margin: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
  },
  listContainer: {
    padding: 12,
  },
  accountCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  siteIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  siteName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    color: '#888',
    fontSize: 14,
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
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 12,
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
  siteOptionDisabled: {
    opacity: 0.5,
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
  siteOptionBadge: {
    color: '#888',
    fontSize: 12,
    marginRight: 8,
  },
  siteOptionCheck: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
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

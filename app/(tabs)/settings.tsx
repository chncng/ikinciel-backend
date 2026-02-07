// ============================================
// 2.EL AVCISI - AYARLAR EKRANI
// ============================================

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { resetDatabase } from '../../src/database/schema';
import { AutoScanService, SCAN_INTERVALS, ScanInterval } from '../../src/services/autoScanService';
import { NotificationService } from '../../src/services/notificationService';

export default function SettingsScreen() {
  const [showAbout, setShowAbout] = useState(false);
  const [showIntervalPicker, setShowIntervalPicker] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanState, setScanState] = useState(AutoScanService.getState());

  // Ekran her görünür olduğunda state'i güncelle
  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        setScanState(AutoScanService.getState());
      }, 1000);

      return () => clearInterval(interval);
    }, [])
  );

  const handleToggleAutoScan = async () => {
    if (scanState.isRunning) {
      AutoScanService.stop();
      setScanState(AutoScanService.getState());
    } else {
      // Bildirim izni iste
      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Bildirim İzni',
          'Yeni ilanlardan haberdar olmak için bildirim iznine ihtiyaç var.',
          [{ text: 'Tamam' }]
        );
      }

      await AutoScanService.start(scanState.interval);
      setScanState(AutoScanService.getState());
      Alert.alert('Başarılı', 'Otomatik tarama başlatıldı');
    }
  };

  const handleChangeInterval = async (interval: ScanInterval) => {
    await AutoScanService.changeInterval(interval);
    setScanState(AutoScanService.getState());
    setShowIntervalPicker(false);
  };

  const handleManualScan = async () => {
    setIsScanning(true);
    try {
      const newCount = await AutoScanService.manualScan();
      Alert.alert(
        'Tarama Tamamlandı',
        newCount > 0
          ? `${newCount} yeni ilan bulundu!`
          : 'Yeni ilan bulunamadı'
      );
      setScanState(AutoScanService.getState());
    } catch {
      Alert.alert('Hata', 'Tarama sırasında hata oluştu');
    } finally {
      setIsScanning(false);
    }
  };

  const handleResetDatabase = () => {
    Alert.alert(
      'Veritabanını Sıfırla',
      'Tüm veriler silinecek. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            try {
              AutoScanService.stop();
              await resetDatabase();
              AutoScanService.resetStats();
              setScanState(AutoScanService.getState());
              Alert.alert('Başarılı', 'Veritabanı sıfırlandı');
            } catch {
              Alert.alert('Hata', 'Sıfırlama başarısız');
            }
          },
        },
      ]
    );
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const selectedInterval = SCAN_INTERVALS.find(i => i.value === scanState.interval);

  return (
    <ScrollView style={styles.container}>
      {/* Otomatik Tarama Durumu */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>
            {scanState.isRunning ? '🟢 Otomatik Tarama Aktif' : '🔴 Otomatik Tarama Kapalı'}
          </Text>
          <Switch
            value={scanState.isRunning}
            onValueChange={handleToggleAutoScan}
            trackColor={{ false: '#2d2d44', true: '#4CAF50' }}
            thumbColor={scanState.isRunning ? '#fff' : '#888'}
          />
        </View>

        {scanState.isRunning && (
          <>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Son Tarama:</Text>
              <Text style={styles.statusValue}>{formatDate(scanState.lastScanTime)}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Sonraki Tarama:</Text>
              <Text style={styles.statusValue}>{formatDate(scanState.nextScanTime)}</Text>
            </View>
          </>
        )}

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Toplam Tarama:</Text>
          <Text style={styles.statusValue}>{scanState.totalScans}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Bulunan İlan:</Text>
          <Text style={styles.statusValue}>{scanState.totalNewListings}</Text>
        </View>
      </View>

      {/* Tarama Ayarları */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tarama Ayarları</Text>

        <TouchableOpacity
          style={styles.item}
          onPress={() => setShowIntervalPicker(true)}
        >
          <Text style={styles.itemIcon}>⏰</Text>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>Kontrol Sıklığı</Text>
            <Text style={styles.itemSubtitle}>{selectedInterval?.label}</Text>
          </View>
          <Text style={styles.itemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.item, isScanning && styles.itemDisabled]}
          onPress={handleManualScan}
          disabled={isScanning}
        >
          <Text style={styles.itemIcon}>🔄</Text>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>Manuel Tarama</Text>
            <Text style={styles.itemSubtitle}>
              {isScanning ? 'Taranıyor...' : 'Şimdi tara'}
            </Text>
          </View>
          {isScanning && <ActivityIndicator color="#4CAF50" />}
        </TouchableOpacity>
      </View>

      {/* Bildirimler */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bildirimler</Text>

        <TouchableOpacity
          style={styles.item}
          onPress={async () => {
            const granted = await NotificationService.requestPermissions();
            Alert.alert(
              granted ? 'İzin Verildi' : 'İzin Reddedildi',
              granted
                ? 'Bildirimler açık'
                : 'Ayarlardan bildirimleri açabilirsiniz'
            );
          }}
        >
          <Text style={styles.itemIcon}>🔔</Text>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>Bildirim İzinleri</Text>
            <Text style={styles.itemSubtitle}>İzin durumunu kontrol et</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.item}
          onPress={async () => {
            await NotificationService.cancelAllNotifications();
            await NotificationService.setBadgeCount(0);
            Alert.alert('Başarılı', 'Tüm bildirimler temizlendi');
          }}
        >
          <Text style={styles.itemIcon}>🗑️</Text>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>Bildirimleri Temizle</Text>
            <Text style={styles.itemSubtitle}>Tüm bildirimleri sil</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Veri */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Veri</Text>

        <TouchableOpacity style={styles.item}>
          <Text style={styles.itemIcon}>📤</Text>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>Verileri Dışa Aktar</Text>
            <Text style={styles.itemSubtitle}>Yedek oluştur</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.item}
          onPress={() => {
            AutoScanService.resetStats();
            setScanState(AutoScanService.getState());
            Alert.alert('Başarılı', 'İstatistikler sıfırlandı');
          }}
        >
          <Text style={styles.itemIcon}>📊</Text>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>İstatistikleri Sıfırla</Text>
            <Text style={styles.itemSubtitle}>Tarama sayaçlarını sıfırla</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={handleResetDatabase}>
          <Text style={styles.itemIcon}>⚠️</Text>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>Veritabanını Sıfırla</Text>
            <Text style={styles.itemSubtitle}>Tüm verileri sil</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Hakkında */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hakkında</Text>

        <TouchableOpacity style={styles.item} onPress={() => setShowAbout(true)}>
          <Text style={styles.itemIcon}>ℹ️</Text>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>Uygulama Hakkında</Text>
            <Text style={styles.itemSubtitle}>Versiyon 1.0.0</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Interval Picker Modal */}
      <Modal
        visible={showIntervalPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowIntervalPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tarama Sıklığı</Text>

            {SCAN_INTERVALS.map(interval => (
              <TouchableOpacity
                key={interval.value}
                style={[
                  styles.intervalOption,
                  scanState.interval === interval.value && styles.intervalOptionSelected,
                ]}
                onPress={() => handleChangeInterval(interval.value)}
              >
                <Text style={styles.intervalOptionText}>{interval.label}</Text>
                {scanState.interval === interval.value && (
                  <Text style={styles.intervalOptionCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalBtnClose}
              onPress={() => setShowIntervalPicker(false)}
            >
              <Text style={styles.modalBtnCloseText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal
        visible={showAbout}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAbout(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.appIcon}>🔍</Text>
            <Text style={styles.appTitle}>2.El Avcısı</Text>
            <Text style={styles.appVersion}>Versiyon 1.0.0</Text>

            <View style={styles.divider} />

            <Text style={styles.aboutTitle}>Özellikler:</Text>
            <Text style={styles.aboutText}>
              • Otomatik ilan takibi (1 dk - 3 saat){'\n'}
              • 6 farklı site desteği{'\n'}
              • Anahtar kelime bazlı arama{'\n'}
              • Fiyat filtreleme{'\n'}
              • Anlık bildirimler{'\n'}
              • Favori ilanlar{'\n'}
              • Güvenli hesap saklama
            </Text>

            <View style={styles.divider} />

            <Text style={styles.aboutTitle}>Desteklenen Siteler:</Text>
            <Text style={styles.aboutText}>
              🏠 Sahibinden{'\n'}
              📦 Letgo{'\n'}
              👗 Dolap{'\n'}
              👔 Gardrops{'\n'}
              📚 Kitantik{'\n'}
              📖 Nadir Kitap
            </Text>

            <View style={styles.divider} />

            <Text style={styles.developer}>Geliştirici: Cihan CİNGÜ</Text>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAbout(false)}
            >
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1e',
  },
  statusCard: {
    backgroundColor: '#1a1a2e',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  statusTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    color: '#888',
    fontSize: 14,
  },
  statusValue: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 20,
    marginHorizontal: 12,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  itemDisabled: {
    opacity: 0.5,
  },
  itemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemSubtitle: {
    color: '#888',
    fontSize: 13,
  },
  itemArrow: {
    color: '#888',
    fontSize: 24,
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
    padding: 24,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  intervalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2d2d44',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  intervalOptionSelected: {
    backgroundColor: '#4CAF50',
  },
  intervalOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  intervalOptionCheck: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBtnClose: {
    backgroundColor: '#2d2d44',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  modalBtnCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  appIcon: {
    fontSize: 64,
    marginBottom: 12,
    textAlign: 'center',
  },
  appTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  appVersion: {
    color: '#888',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#2d2d44',
    marginVertical: 20,
  },
  aboutTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aboutText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  developer: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

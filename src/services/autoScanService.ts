// ============================================
// 2.EL AVCISI - AUTOMATIC SCAN SERVICE
// ============================================

import { SearchKeywordService } from '../database/services';
import { ScraperService } from './scraperService';
import { NotificationService } from './notificationService';

export type ScanInterval = 1 | 5 | 10 | 30 | 60 | 120 | 180; // dakika cinsinden

interface AutoScanState {
  isRunning: boolean;
  interval: ScanInterval;
  lastScanTime: string | null;
  nextScanTime: string | null;
  totalScans: number;
  totalNewListings: number;
}

class AutoScanManager {
  private intervalId: NodeJS.Timeout | null = null;
  private state: AutoScanState = {
    isRunning: false,
    interval: 30, // Varsayılan 30 dakika
    lastScanTime: null,
    nextScanTime: null,
    totalScans: 0,
    totalNewListings: 0,
  };

  /**
   * Otomatik taramayı başlat
   */
  async start(intervalMinutes: ScanInterval = 30): Promise<void> {
    if (this.state.isRunning) {
      console.log('⚠️ Otomatik tarama zaten çalışıyor');
      return;
    }

    this.state.interval = intervalMinutes;
    this.state.isRunning = true;

    console.log(`▶️ Otomatik tarama başlatıldı (${intervalMinutes} dakika arayla)`);

    // İlk taramayı hemen yap
    await this.performScan();

    // Periyodik taramayı ayarla
    const intervalMs = intervalMinutes * 60 * 1000;
    this.intervalId = setInterval(async () => {
      await this.performScan();
    }, intervalMs);

    this.updateNextScanTime();
  }

  /**
   * Otomatik taramayı durdur
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.state.isRunning = false;
    this.state.nextScanTime = null;

    console.log('⏸️ Otomatik tarama durduruldu');
  }

  /**
   * Tek bir tarama işlemi gerçekleştir
   */
  async performScan(): Promise<void> {
    try {
      console.log('🔍 Tarama başlıyor...');
      this.state.lastScanTime = new Date().toISOString();

      // Aktif anahtar kelimeleri al
      const keywords = await SearchKeywordService.getActive();

      if (keywords.length === 0) {
        console.log('ℹ️ Aktif anahtar kelime yok');
        return;
      }

      // Tüm anahtar kelimeleri tara
      const result = await ScraperService.searchAllKeywords(keywords);

      this.state.totalScans++;
      this.state.totalNewListings += result.total;

      console.log(`✅ Tarama tamamlandı: ${result.total} yeni ilan bulundu`);

      // Eğer çok sayıda ilan bulunduysa toplu bildirim gönder
      if (result.total > 5) {
        await NotificationService.sendMultipleListingsNotification(
          result.total,
          'Tüm Siteler'
        );
      }

      // Badge count'u güncelle
      await NotificationService.setBadgeCount(result.total);

      this.updateNextScanTime();
    } catch (error) {
      console.error('❌ Tarama hatası:', error);
    }
  }

  /**
   * Manuel tarama tetikle
   */
  async manualScan(): Promise<number> {
    console.log('🔄 Manuel tarama başlatıldı');
    const keywords = await SearchKeywordService.getActive();

    if (keywords.length === 0) {
      return 0;
    }

    const result = await ScraperService.searchAllKeywords(keywords);
    console.log(`✅ Manuel tarama: ${result.total} yeni ilan`);

    return result.total;
  }

  /**
   * Tarama aralığını değiştir
   */
  async changeInterval(intervalMinutes: ScanInterval): Promise<void> {
    const wasRunning = this.state.isRunning;

    if (wasRunning) {
      this.stop();
    }

    this.state.interval = intervalMinutes;

    if (wasRunning) {
      await this.start(intervalMinutes);
    }

    console.log(`⏱️ Tarama aralığı ${intervalMinutes} dakikaya değiştirildi`);
  }

  /**
   * Durum bilgisini döndür
   */
  getState(): AutoScanState {
    return { ...this.state };
  }

  /**
   * Sonraki tarama zamanını hesapla
   */
  private updateNextScanTime(): void {
    if (!this.state.isRunning) {
      this.state.nextScanTime = null;
      return;
    }

    const next = new Date();
    next.setMinutes(next.getMinutes() + this.state.interval);
    this.state.nextScanTime = next.toISOString();
  }

  /**
   * İstatistikleri sıfırla
   */
  resetStats(): void {
    this.state.totalScans = 0;
    this.state.totalNewListings = 0;
    console.log('📊 İstatistikler sıfırlandı');
  }
}

// Singleton instance
export const AutoScanService = new AutoScanManager();

// Interval seçenekleri
export const SCAN_INTERVALS = [
  { label: '1 Dakika', value: 1 as ScanInterval },
  { label: '5 Dakika', value: 5 as ScanInterval },
  { label: '10 Dakika', value: 10 as ScanInterval },
  { label: '30 Dakika', value: 30 as ScanInterval },
  { label: '1 Saat', value: 60 as ScanInterval },
  { label: '2 Saat', value: 120 as ScanInterval },
  { label: '3 Saat', value: 180 as ScanInterval },
];

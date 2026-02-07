// ============================================
// 2.EL AVCISI - NOTIFICATION SERVICE
// ============================================

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Listing } from '../types';

// Bildirim davranışını ayarla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationService = {
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Bildirim izni verilmedi');
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('new-listings', {
          name: 'Yeni İlanlar',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4CAF50',
        });
      }

      return true;
    } catch (error) {
      console.error('Bildirim izni hatası:', error);
      return false;
    }
  },

  async sendNewListingNotification(listing: Listing, siteName: string): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🎉 ${siteName} - Yeni İlan!`,
          body: `${listing.title}\n💰 ${listing.price.toLocaleString('tr-TR')} ${listing.currency}`,
          data: {
            listingId: listing.id,
            listingUrl: listing.listingUrl,
            siteName: listing.siteName,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Anında göster
      });
    } catch (error) {
      console.error('Bildirim gönderme hatası:', error);
    }
  },

  async sendMultipleListingsNotification(count: number, siteName: string): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🎉 ${siteName} - ${count} Yeni İlan!`,
          body: `${count} yeni ilan bulundu. Hemen incele!`,
          data: { siteName },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Bildirim gönderme hatası:', error);
    }
  },

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Bildirim iptal hatası:', error);
    }
  },

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Badge count hatası:', error);
      return 0;
    }
  },

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Badge set hatası:', error);
    }
  },
};

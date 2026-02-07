// ============================================
// 2.EL AVCISI - ENCRYPTION UTILITY
// ============================================

import * as Crypto from 'expo-crypto';

const ENCRYPTION_KEY = 'ikinciel-avci-secret-key-2026'; // Production'da daha güvenli olmalı

export const encryptPassword = async (password: string): Promise<string> => {
  try {
    // Simple XOR encryption with hash
    const key = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      ENCRYPTION_KEY
    );

    const encrypted = password
      .split('')
      .map((char, i) => {
        const keyChar = key.charCodeAt(i % key.length);
        const encryptedChar = char.charCodeAt(0) ^ keyChar;
        return encryptedChar.toString(16).padStart(2, '0');
      })
      .join('');

    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Şifre şifrelenirken hata oluştu');
  }
};

export const decryptPassword = async (encryptedPassword: string): Promise<string> => {
  try {
    const key = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      ENCRYPTION_KEY
    );

    const decrypted = encryptedPassword
      .match(/.{1,2}/g)
      ?.map((hex, i) => {
        const encryptedChar = parseInt(hex, 16);
        const keyChar = key.charCodeAt(i % key.length);
        return String.fromCharCode(encryptedChar ^ keyChar);
      })
      .join('') || '';

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Şifre çözülürken hata oluştu');
  }
};

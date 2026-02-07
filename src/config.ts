// ============================================
// 2.EL AVCISI - CONFIGURATION
// ============================================

// Backend API URL
// Development: http://localhost:3000
// Production: https://your-backend.com
export const API_CONFIG = {
  // DEMO MODE: Sahte veriler kullanır (backend gerekmez)
  // PRODUCTION MODE: Gerçek backend API'yi kullanır
  USE_DEMO_MODE: false,  // ⚠️ false yapıldı - Production mode aktif

  // Backend API URL (Production mode için)
  // ⚠️ Buraya Render.com'dan aldığın URL'i yaz!
  BACKEND_URL: 'https://ikinciel-backend.onrender.com',  // Render.com (ÜCRETSİZ!)
  // BACKEND_URL: 'https://ikinciel-backend.up.railway.app',  // Railway ($5/ay)
  // BACKEND_URL: 'https://ikinciel-backend.herokuapp.com',  // Heroku
  // BACKEND_URL: 'http://localhost:3000',  // Local test

  // API Key (Eğer backend'de authentication varsa)
  API_KEY: '',

  // Request timeout (ms)
  TIMEOUT: 30000,
};

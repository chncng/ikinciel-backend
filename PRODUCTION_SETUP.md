# 2.El Avcısı - Production Setup Rehberi

Bu rehber, 2.El Avcısı uygulamasını DEMO moddan gerçek scraping moduna geçirmek için gereken adımları açıklar.

## 📋 İçindekiler

1. [Mevcut Durum (DEMO Mode)](#mevcut-durum-demo-mode)
2. [Production Mode'a Geçiş](#production-modea-geçiş)
3. [Backend Kurulumu](#backend-kurulumu)
4. [Mobil Uygulama Güncelleme](#mobil-uygulama-güncelleme)
5. [Deployment Seçenekleri](#deployment-seçenekleri)
6. [Test](#test)
7. [Sorun Giderme](#sorun-giderme)

---

## Mevcut Durum (DEMO Mode)

✅ **Şu an çalışan özellikler:**
- Mobil uygulama tam çalışıyor
- Arama ekleme/silme
- Otomatik tarama
- Bildirimler
- Favori işaretleme
- Filtreleme ve arama

❌ **DEMO mode sınırlamaları:**
- İlanlar sahte/rastgele üretiliyor
- Gerçek web sitelerinden veri çekilmiyor
- İlan linkleri arama sayfalarına yönlendiriyor

---

## Production Mode'a Geçiş

Production mode'da:
- Backend API sunucusu gerçek web sitelerini tarar
- Mobil uygulama backend'e API çağrıları yapar
- Gerçek ilan verileri ve linkler kullanılır

**Gereksinimler:**
1. Backend sunucusu (Node.js + Puppeteer)
2. Sunucu/hosting (DigitalOcean, Heroku, Railway vb.)
3. Mobil uygulamada config değişikliği

**Maliyet:**
- Minimum: $5/ay (Railway, DigitalOcean)
- Orta: $15-30/ay (daha hızlı sunucu)
- Ücretsiz: Heroku/Render free tier (sınırlı)

---

## Backend Kurulumu

### Adım 1: Bağımlılıkları Yükle

```bash
cd backend
npm install
```

### Adım 2: Environment Variables Ayarla

```bash
cp .env.example .env
```

`.env` dosyasını düzenle:
```env
PORT=3000
NODE_ENV=production
# API_KEY=your-secret-key  # İsteğe bağlı
```

### Adım 3: Yerel Test

```bash
npm run dev
```

Tarayıcıda test: `http://localhost:3000/health`

### Adım 4: API Test

Postman veya curl ile:

```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "sahibinden",
    "keyword": "iphone 13",
    "minPrice": 5000,
    "maxPrice": 15000
  }'
```

---

## Mobil Uygulama Güncelleme

### Adım 1: Config Dosyasını Güncelle

`src/config.ts` dosyasını aç ve şunları değiştir:

```typescript
export const API_CONFIG = {
  // DEMO mode'u kapat
  USE_DEMO_MODE: false,  // true → false yap

  // Backend URL'ini güncelle
  BACKEND_URL: 'https://your-backend.herokuapp.com',  // Kendi backend URL'in

  // API Key (varsa)
  API_KEY: 'your-api-key',
};
```

### Adım 2: Yeni APK Oluştur

```bash
npx eas-cli build --profile preview --platform android
```

### Adım 3: APK'yı Test Et

1. Yeni APK'yı indir ve yükle
2. Arama ekle
3. Manuel tarama yap
4. İlanların gerçek verilerle geldiğini kontrol et

---

## Deployment Seçenekleri

### Seçenek 1: Railway.app (Önerilen)

**Artıları:**
- Kolay setup (5 dakika)
- GitHub otomatik deploy
- $5/ay
- SSL dahil

**Adımlar:**
1. https://railway.app'e kayıt ol
2. "New Project" → "Deploy from GitHub"
3. Repository'i seç
4. Root Directory: `backend`
5. Deploy!

Railway otomatik URL verir: `https://ikinciel-backend.up.railway.app`

### Seçenek 2: DigitalOcean Droplet

**Artıları:**
- Tam kontrol
- $5/ay (en ucuz droplet)
- İyi performans

**Adımlar:**
1. Ubuntu 22.04 droplet oluştur
2. SSH ile bağlan
3. Node.js kur:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

4. Projeyi clone'la:
```bash
git clone <your-repo>
cd backend
npm install --production
```

5. PM2 ile çalıştır:
```bash
sudo npm install -g pm2
pm2 start index.js --name ikinciel-backend
pm2 startup
pm2 save
```

6. Nginx reverse proxy kur (opsiyonel):
```bash
sudo apt install nginx
```

### Seçenek 3: Heroku (Ücretsiz/Ücretli)

**Artıları:**
- Basit deployment
- Ücretsiz tier (sınırlı)

**Adımlar:**
1. Heroku CLI kur
2. Login:
```bash
heroku login
```

3. App oluştur:
```bash
heroku create ikinciel-backend
```

4. Puppeteer buildpack ekle:
```bash
heroku buildpacks:add jontewks/puppeteer
```

5. Deploy:
```bash
cd backend
git init
heroku git:remote -a ikinciel-backend
git add .
git commit -m "Initial commit"
git push heroku main
```

6. URL'i al:
```bash
heroku info
```

### Seçenek 4: Render.com

**Artıları:**
- Ücretsiz tier
- Otomatik HTTPS
- GitHub integration

**Adımlar:**
1. https://render.com'a kayıt ol
2. "New Web Service"
3. GitHub repo'yu bağla
4. Settings:
   - Name: `ikinciel-backend`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Create Web Service

---

## Test

### Backend Test

```bash
# Health check
curl https://your-backend.com/health

# Scrape test
curl -X POST https://your-backend.com/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "sahibinden",
    "keyword": "test"
  }'
```

### Mobil Uygulama Test

1. **Config kontrolü:**
   - `src/config.ts` → `USE_DEMO_MODE: false`
   - `BACKEND_URL` doğru mu?

2. **Test adımları:**
   - Yeni arama ekle
   - Manuel tarama yap
   - 1-2 dakika bekle
   - İlanlar geldi mi?
   - İlana tıkla → Gerçek ilan sayfası açıldı mı?

3. **Log kontrolü:**
   ```bash
   # Backend logs (Railway)
   railway logs

   # Backend logs (Heroku)
   heroku logs --tail

   # Backend logs (DigitalOcean)
   pm2 logs ikinciel-backend
   ```

---

## Sorun Giderme

### Sorun 1: Backend'e bağlanamıyor

**Çözüm:**
- Backend çalışıyor mu kontrol et
- URL doğru mu?
- CORS aktif mi?
- Firewall/port açık mı?

### Sorun 2: Scraping başarısız

**Çözüm:**
- Site HTML'i değişmiş olabilir
- Selector'ları güncelle
- Backend logs kontrol et

### Sorun 3: Çok yavaş

**Çözüm:**
- Sunucu RAM'ini artır
- Concurrent request limiti ekle
- Caching implement et

### Sorun 4: Captcha/Bot detection

**Çözüm:**
- User agent randomize et
- Request rate'i azalt
- Proxy kullan (ücretli)

---

## Önemli Notlar

### Yasal Uyarı
⚠️ Web scraping bazı sitelerin kullanım şartlarını ihlal edebilir. Sorumlu kullanım:
- Sitelere aşırı yük bindirme
- robots.txt'e saygı göster
- Rate limiting kullan
- Ticari kullanım için izin al

### Bakım
- Sitelerin HTML yapısı sık değişir
- Scrapers'ı düzenli güncelle
- Log monitoring yap
- Error tracking kullan (Sentry)

### Güvenlik
- API key kullan
- HTTPS zorunlu
- Credentials'ı encrypt et
- Environment variables kullan

---

## Özet Kontrol Listesi

Deployment için:
- [ ] Backend kuruldu ve test edildi
- [ ] Sunucuya deploy edildi
- [ ] Backend URL'i alındı
- [ ] `src/config.ts` güncellendi (`USE_DEMO_MODE: false`)
- [ ] `src/config.ts` backend URL'i eklendi
- [ ] Yeni APK build edildi
- [ ] Mobil uygulamada test edildi
- [ ] İlanlar gerçek verilerle geliyor
- [ ] İlan linkleri çalışıyor

---

## Destek

Sorun yaşarsanız:
1. Backend logs'u kontrol edin
2. Mobil app console'u kontrol edin
3. API'yi Postman ile test edin
4. GitHub'da issue açın

**Başarılar! 🚀**

# 🆓 ÜCRETSİZ Backend Kurulumu

2.El Avcısı uygulamasını tamamen ücretsiz çalıştırma rehberi.

## 📋 Genel Bakış

**Maliyet:** 0₺/ay (Tamamen ücretsiz)
**Süre:** 15 dakika
**Platform:** Render.com (Free Tier)

---

## 🎯 Adım Adım Kurulum

### ADIM 1: GitHub'a Yükle (5 dakika)

Backend kodunu GitHub'a yüklemen gerekiyor.

```bash
# Terminal'de
cd "c:\Users\ASUS\OneDrive\Masaüstü\2ElAvciIkincielAvci"

# Git varsa kontrol et
git --version

# Git yoksa indir: https://git-scm.com/download/win

# Git repo başlat
git init

# Tüm dosyaları ekle
git add .

# Commit yap
git commit -m "2.El Avcısı projesi eklendi"
```

**GitHub'da repo oluştur:**
1. https://github.com/new
2. Repository name: `ikinciel-avcisi`
3. Public seç (ücretsiz için gerekli)
4. "Create repository"

**Push et:**
```bash
# GitHub'dan aldığın URL'i kullan
git remote add origin https://github.com/KULLANICI_ADIN/ikinciel-avcisi.git
git branch -M main
git push -u origin main
```

---

### ADIM 2: Render.com'a Deploy Et (10 dakika)

**2.1 Kayıt Ol**
1. https://render.com
2. "Get Started for Free"
3. "Sign in with GitHub" (önerilen)
4. GitHub izni ver

**2.2 Web Service Oluştur**
1. Dashboard'da "New +" butonuna tıkla
2. "Web Service" seç
3. "Connect a repository" → GitHub'ı bağla
4. Repository listesinde `ikinciel-avcisi`'yi bul ve "Connect"

**2.3 Ayarları Yap**

```
Name: ikinciel-backend
Region: Frankfurt (Europe - West)
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm start
```

**Environment Variables (opsiyonel):**
- Gerek yok, varsayılanlar yeterli

**2.4 Free Plan Seç**
⚠️ **ÖNEMLİ:** "Instance Type" → **"Free"** seç!

**2.5 Deploy Et**
- "Create Web Service" butonuna tıkla
- 5-10 dakika bekle
- Deploy tamamlanınca yeşil tick göreceksin

**2.6 URL'i Kopyala**
Deploy bitince üstte URL çıkar:
```
https://ikinciel-backend.onrender.com
```

Bu URL'i kopyala!

---

### ADIM 3: URL'i Test Et

**Tarayıcıda test:**
```
https://ikinciel-backend.onrender.com/health
```

**Başarılı response:**
```json
{
  "status": "ok",
  "timestamp": "2024-02-03T..."
}
```

⚠️ **İlk açılış 30 saniye sürebilir** (Render'ın ücretsiz tier'ı uyuyor)

**API test (opsiyonel):**
Postman veya https://reqbin.com ile:
```
POST https://ikinciel-backend.onrender.com/api/scrape
Content-Type: application/json

{
  "siteName": "sahibinden",
  "keyword": "test"
}
```

---

### ADIM 4: Mobil Uygulamayı Güncelle

Config dosyası zaten güncellenmiş durumda:
- `USE_DEMO_MODE: false` ✅
- `BACKEND_URL: 'https://ikinciel-backend.onrender.com'` ✅

Eğer URL farklıysa [src/config.ts](src/config.ts) dosyasında düzenle.

---

### ADIM 5: Yeni APK Build Et

```bash
cd "c:\Users\ASUS\OneDrive\Masaüstü\2ElAvciIkincielAvci"
npx eas-cli build --profile preview --platform android
```

Build bitince APK linkini al ve telefonuna yükle.

---

## ✅ Test Et

1. **Uygulamayı Aç**
   - "Yükleniyor..." göreceksin
   - Normal açılmalı

2. **Arama Ekle**
   - Aramalar → Yeni Arama
   - Site: Sahibinden (auth gerektirmez)
   - Kelime: "telefon"
   - Kaydet

3. **Manuel Tarama**
   - Ayarlar → "Tarama Başlat"
   - **İlk tarama yavaş olabilir** (backend uyanıyor - 30 saniye)
   - Sonraki taramalar hızlı

4. **İlanları Kontrol Et**
   - İlanlar sekmesine git
   - Gerçek veriler geldi mi?
   - İlana tıkla
   - Gerçek ilan sayfası açıldı mı?

---

## 💡 Render.com Ücretsiz Tier Özellikleri

### ✅ Avantajlar
- Tamamen ücretsiz
- 750 saat/ay (31 gün * 24 saat)
- Otomatik HTTPS
- Otomatik deploy (GitHub push'ta)
- Güvenilir

### ⚠️ Sınırlamalar
1. **Uyku Modu:**
   - 15 dakika istek yoksa uyur
   - İlk istek 30 saniye sürer (uyanma)
   - Sonraki istekler normal hızda

2. **Kaynak Sınırları:**
   - 512MB RAM
   - Paylaşımlı CPU
   - Yeterli bu uygulama için

3. **Build Süresi:**
   - İlk deploy 5-10 dakika
   - Güncellemeler 3-5 dakika

### 💡 Çözümler

**Uyku problemini çözme:**
Ücretsiz bir cron service kullan (15 dk'da bir ping atar):
1. https://cron-job.org (ücretsiz)
2. "Create cronjob"
3. URL: `https://ikinciel-backend.onrender.com/health`
4. Interval: 15 dakika
5. Start

Bu şekilde backend hiç uyumaz!

---

## 🆚 Alternatif Ücretsiz Seçenekler

### Railway.app
- ✅ İlk ay 5$ kredi (ücretsiz)
- ✅ Daha hızlı, uyumaz
- ❌ Sonra 5$/ay

### Fly.io
- ✅ 3 ücretsiz VM
- ✅ Uyumaz
- ⚠️ Setup biraz karmaşık

### Glitch
- ✅ Tamamen ücretsiz
- ❌ Daha yavaş
- ❌ Sık uyur

**Önerim:** Render.com yeterli!

---

## 🔧 Sorun Giderme

### Backend açılmıyor
**Çözüm:**
1. Render dashboard'da logs kontrol et
2. "Manual Deploy" → "Clear build cache & deploy"

### "Cannot connect to backend"
**Çözüm:**
1. URL doğru mu? (config.ts)
2. Backend deploy edildi mi? (Render dashboard)
3. /health çalışıyor mu?

### İlk tarama çok yavaş
**Normal!** Backend uyuyor, 30 saniye uyanma süresi var.
Çözüm: Cron-job.org ile otomatik ping at.

### Scraping başarısız
**Çözüm:**
1. Render logs kontrol et
2. Site HTML'i değişmiş olabilir
3. Scrapers güncelle

---

## 📊 Maliyet Karşılaştırması

| Seçenek | Maliyet | Hız | Uyku | Önerilen |
|---------|---------|-----|------|----------|
| **Render Free** | 0₺/ay | Orta | Evet | ⭐ Başlangıç |
| Railway | 150₺/ay | Hızlı | Hayır | Production |
| DigitalOcean | 150₺/ay | Hızlı | Hayır | Production |

---

## 🎯 Özet

1. ✅ Backend kodu hazır
2. ✅ GitHub'a push et
3. ✅ Render.com'a deploy et (ücretsiz)
4. ✅ URL'i config'e yaz
5. ✅ Yeni APK build et
6. ✅ Test et

**Toplam maliyet:** 0₺
**Toplam süre:** 15 dakika

---

## 🚀 Sonuç

Render.com'un ücretsiz tier'ı bu uygulama için yeterli!
- Backend çalışıyor ✅
- Gerçek veriler geliyor ✅
- Hiç ödeme yok ✅

Eğer uygulama büyürse ve daha hızlı olmasını istersen, o zaman ücretli plan geç.

**İyi kullanımlar! 🎉**

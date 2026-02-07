# 2.El Avcısı - Backend API

Web scraping backend servisi for 2.El Avcısı mobile application.

## 🚀 Features

- Web scraping for 6 Turkish second-hand marketplaces:
  - Sahibinden.com
  - Letgo
  - Dolap (requires authentication)
  - Gardrops (requires authentication)
  - Kitantik (requires authentication)
  - Nadir Kitap

- RESTful API endpoints
- Rate limiting protection
- CORS enabled
- Helmet security
- Puppeteer-based scraping

## 📋 Requirements

- Node.js 18+
- npm or yarn
- 2GB+ RAM (for Puppeteer)

## 🔧 Installation

```bash
cd backend
npm install
```

## ⚙️ Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env`:
```env
PORT=3000
NODE_ENV=production
```

## 🏃 Running Locally

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will start at `http://localhost:3000`

## 📡 API Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-02-03T..."
}
```

### Single Site Scrape
```
POST /api/scrape
```

Request body:
```json
{
  "siteName": "sahibinden",
  "keyword": "iPhone 13",
  "minPrice": 5000,
  "maxPrice": 15000,
  "credentials": {
    "username": "user@example.com",
    "password": "password123"
  }
}
```

Response:
```json
{
  "success": true,
  "siteName": "sahibinden",
  "keyword": "iPhone 13",
  "count": 25,
  "listings": [
    {
      "title": "iPhone 13 128GB",
      "price": 12000,
      "currency": "TL",
      "imageUrl": "https://...",
      "listingUrl": "https://...",
      "location": "İstanbul",
      "sellerName": null,
      "description": "iPhone 13 128GB",
      "postedAt": "2024-02-03"
    }
  ]
}
```

### Bulk Scrape (Multiple Sites)
```
POST /api/scrape-bulk
```

Request body:
```json
{
  "sites": ["sahibinden", "letgo", "nadirkitap"],
  "keyword": "iPhone 13",
  "minPrice": 5000,
  "maxPrice": 15000
}
```

Response:
```json
{
  "success": true,
  "keyword": "iPhone 13",
  "totalListings": 67,
  "results": [
    {
      "siteName": "sahibinden",
      "success": true,
      "count": 25,
      "listings": [...]
    },
    {
      "siteName": "letgo",
      "success": true,
      "count": 42,
      "listings": [...]
    }
  ]
}
```

## 🌐 Deployment Options

### Option 1: DigitalOcean ($5/month)

1. Create a Droplet (Ubuntu 22.04)
2. SSH into server
3. Install Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

4. Clone and setup:
```bash
git clone <your-repo>
cd backend
npm install --production
```

5. Install PM2:
```bash
sudo npm install -g pm2
pm2 start index.js --name ikinciel-backend
pm2 startup
pm2 save
```

6. Setup nginx reverse proxy:
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/default
```

Add:
```nginx
location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: Heroku (Free tier available)

1. Install Heroku CLI
2. Create app:
```bash
heroku create ikinciel-backend
```

3. Add buildpack for Puppeteer:
```bash
heroku buildpacks:add jontewks/puppeteer
```

4. Deploy:
```bash
git push heroku main
```

### Option 3: Railway.app ($5/month)

1. Sign up at railway.app
2. New Project → Deploy from GitHub
3. Select backend folder
4. Railway auto-detects Node.js and deploys

### Option 4: Render.com (Free tier available)

1. Sign up at render.com
2. New Web Service
3. Connect GitHub repo
4. Root Directory: `backend`
5. Build Command: `npm install`
6. Start Command: `npm start`

## 🔒 Important Notes

### Scraping Legality
- Web scraping may violate site Terms of Service
- Use responsibly and respect robots.txt
- Implement rate limiting to avoid overloading servers
- Some sites may block bots or require CAPTCHA solving

### Puppeteer Memory
- Each scraper launches a browser instance
- Memory usage: ~300MB per browser
- Limit concurrent requests on low-memory servers

### Site Changes
- Websites frequently update their HTML structure
- Scrapers may need selector updates
- Monitor logs for scraping failures

### Authentication
- Store credentials securely (encrypted in mobile app)
- Never log passwords
- Consider OAuth if sites support it

## 🔐 Security Recommendations

1. Add API key authentication:
```javascript
// In index.js
app.use('/api', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

2. Use HTTPS in production
3. Implement request logging
4. Add monitoring (e.g., Sentry)

## 📊 Monitoring

View logs with PM2:
```bash
pm2 logs ikinciel-backend
pm2 monit
```

## 🐛 Troubleshooting

**Puppeteer fails to launch:**
```bash
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

**Memory issues:**
- Increase swap space
- Limit concurrent requests
- Use headless mode (already enabled)

## 📝 License

MIT

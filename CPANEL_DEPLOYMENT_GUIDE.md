# cPanel (Apache) Static Deployment Guide for Pakura Sonatan Jubo Songho

This guide explains step-by-step how to build, configure, and host this React + Vite Single Page Application on any cPanel Apache hosting server (e.g. Namecheap, Bluehost, Hostinger, GoDaddy, or your own VPS).

---

## 1. Quick Build & Deployment Steps

### Step 1: Set Your Firebase Credentials
Open `src/lib/firebaseConfig.ts` and verify or paste your Firebase project keys:
- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

*(Alternatively, you can place them into a `.env.production` file using `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc.)*

### Step 2: Build the Static Application
In your terminal, run:
```bash
npm run build
```
This will compile all TypeScript and React code into a clean, optimized static production bundle in the `dist/` folder.

### Step 3: Upload to cPanel
1. Log into your **cPanel**.
2. Open **File Manager** and navigate to your web root (usually `public_html/` or a subdomain folder like `public_html/finance/`).
3. If there are default placeholder files (e.g., `default.html` or old index files), delete or back them up.
4. Upload all files and folders located **inside** the `dist/` folder:
   - `index.html`
   - `.htaccess` *(Note: Files starting with a dot might be hidden in cPanel File Manager; click **Settings** at top right of File Manager and check "Show Hidden Files (dotfiles)")*
   - `assets/` (folder containing JS, CSS, fonts, and images)
5. Visit your domain in the browser (e.g., `https://yourdomain.com`).

---

## 2. Apache `.htaccess` Routing (Preventing 404 on Refresh)

A pre-configured `.htaccess` file is placed in `public/.htaccess`, which Vite automatically copies to `dist/.htaccess` during `npm run build`.

If you ever need to manually create or check `.htaccess` in your cPanel `public_html/`, here is the configuration:

```apache
# ==============================================================================
# Apache .htaccess configuration for React + Vite Single Page Application (SPA)
# ==============================================================================

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # 1. OPTIONAL: Force HTTPS (uncomment if SSL is active on your domain)
  # RewriteCond %{HTTPS} off
  # RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # 2. Serve actual existing files, directories, and assets directly
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # 3. Fallback all remaining routes to index.html for React SPA client-side routing
  RewriteRule ^ index.html [L]
</IfModule>

# Prevent directory browsing
Options -Indexes

# Correct MIME types for modern JS/TS and web fonts
<IfModule mod_mime.c>
  AddType application/javascript .js .mjs
  AddType text/css .css
  AddType image/svg+xml .svg
  AddType font/woff .woff
  AddType font/woff2 .woff2
</IfModule>

# Enable GZIP compression for faster loading on cPanel
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/x-javascript application/json application/xml
</IfModule>

# Cache headers for static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 month"
  ExpiresByType image/png "access plus 1 month"
  ExpiresByType image/jpeg "access plus 1 month"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

# Basic Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
```

---

## 3. Firebase Console: Authorize Your Domain

For Google Login, Email/Password, or Phone Authentication to work on your live domain:
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your Firebase project.
3. In the left menu, click **Authentication** -> **Settings** tab.
4. Scroll down to **Authorized domains**.
5. Click **Add domain** and enter your cPanel domain (e.g. `yourdomain.com` and `www.yourdomain.com`).

---

## 4. Subdirectory Deployment (If NOT using Root Domain)

If you deploy into a subdirectory instead of the root domain (e.g., `https://yourdomain.com/app/` instead of `https://yourdomain.com/`):
1. In `vite.config.ts`, change `base: '/'` to `base: './'` or `base: '/app/'`.
2. In `.htaccess`, change `RewriteBase /` to `RewriteBase /app/` and `RewriteRule ^ index.html [L]` to `RewriteRule ^ /app/index.html [L]`.
3. Re-run `npm run build`.

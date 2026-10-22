# GitHub Pages Deployment & Multi-Device Access Guide

This guide explains how your website is configured to run publicly on **https://pakura-sanatan-jubo-sangha.github.io/** with automatic multi-device cloud synchronization.

---

## 1. Automated GitHub Actions Deployment

The workflow file is configured at **`.github/workflows/build.yml`**.

Whenever you push changes or update code in GitHub, GitHub Actions will automatically:
1. Check out your code
2. Install all dependencies
3. Build the production React + Vite application
4. Publish the files directly to **GitHub Pages**

---

## 2. One-Time Setup in GitHub Repository Settings

To activate GitHub Pages for your repository:

1. Open your repository on GitHub:
   `https://github.com/pakura-sanatan-jubo-sangha/pakura-sanatan-jubo-sangha.github.io`
2. Click on the **Settings** tab at the top.
3. In the left navigation menu, click on **Pages**.
4. Under **Build and deployment**:
   - Set **Source** to **GitHub Actions** (not "Deploy from a branch").
5. That's it! GitHub Actions will automatically trigger and deploy your site to:
   👉 **https://pakura-sanatan-jubo-sangha.github.io/**

---

## 3. One-Time Setup in Firebase Console (For Authentication & Cloud Sync)

To allow signing in and syncing data from any mobile phone, tablet, or computer:

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: **`gen-lang-client-0582819547`**
3. In the left sidebar, click **Authentication** -> **Settings** tab.
4. Scroll down to **Authorized domains**.
5. Click **Add domain** and enter:
   `pakura-sanatan-jubo-sangha.github.io`
6. Click **Save**.

---

## 4. Multi-Device Access & Data Updates

- **Access Anywhere:** You and association members can access the app from any smartphone, tablet, or desktop browser at `https://pakura-sanatan-jubo-sangha.github.io/`.
- **Automatic Cloud Persistence:** All financial records (contributions, loans, payments, incomes, expenses, rules, meetings) are saved to **Firebase Firestore**.
- **Real-time Sync:** When you record a transaction or add a member on your phone, it is saved in the cloud. Anyone viewing the website on another device will see the updated data.
- **Deep-Link & Refresh Protection:** Configured with `public/404.html` and SPA routing so refreshing on any tab (`/#members`, `/#loans`, `/#reports`) never results in a 404 error.

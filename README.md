# Pearls Of Islam

A greenish-white Islamic web app built with React + Vite.

## Deployment checklist (read this before going live)
1. **Build with the real server address.** `.env.local` is copied from `.env.example` and points to `http://localhost:8787`. Before `npm run build`, set `VITE_API_URL` to your server's **https** address. A website on https cannot call an http server (the browser blocks it), and a build made with `localhost` will not work for other people.
2. **Server host:** Node.js 18+, a **persistent disk** for `DATA_DIR`, and the server running all the time (needed for prayer alerts). Check `GET /health` returns `{"ok":true}`.
3. **Server settings:** `ADMIN_EMAIL=you@example.com` and `CORS_ORIGIN=https://your-website` (use a comma list for several, for example `https://your-site.netlify.app,https://localhost` when the Android app is also used). Do not leave `CORS_ORIGIN` as `*` on a public server.
4. **Keep `DATA_DIR/vapid.json` and back up `DATA_DIR`.** If `vapid.json` is lost, every phone must turn prayer alerts on again.
5. **Run `npm run quran:download` once before `npm run build`** so the Quran text is bundled and works offline (`src/data/quran.json` is created; it is not in the zip).
6. **Behind a proxy** (Render, Railway, nginx) the server reads the visitor address from `X-Forwarded-For`, so sign-up and sign-in limits are per visitor.
7. **After an update** the service worker version (`poi-v3` in `public/sw.js`) must change for installed apps to refresh their cache. Raise it when you ship a visual or code change that must reach people at once.

## Run it
You need Node.js 18+ (https://nodejs.org).

```bash
cd pearls-of-islam
npm install
npm run dev        # open the http://localhost:5173 address it prints
```
Production build: `npm run build` (output in `dist/`), preview with `npm run preview`.

## Project structure
```
index.html
package.json
vite.config.js
capacitor.config.json     (for the Android app, see below)
public/
  manifest.webmanifest   app name, colours, icons
  sw.js                  service worker (installable + offline)
  icons/                 app icons
src/
  main.jsx               entry point
  App.jsx                login gate, app shell, prayer-time loading, adhan scheduler
  App.css                all styles (light = green and white, dark = green and black)
  context.js             shared app state (user, settings, prayer times)
  lib/
    constants.js         reciters, calculation methods, API URLs
    storage.js           local "database" (users, join log, session) + password hashing
    utils.js             date/time helpers, default settings
    offline.js           offline prayer-time calculation + short surahs fallback
    theme.js             light/dark mode (saved on the device)
    api.js               talks to the lecture server
  components/
    Auth.jsx             signup + login
    Home.jsx             next-prayer countdown, progress
    Quran.jsx            114 surahs, 14 reciters (qirat), player, bookmarks
    ThemeToggle.jsx      dark/light button used in the navbar
    Splash.jsx           opening screen with the logo
    Logo.jsx             the Quran logo
    Prayers.jsx          prayer times, location, adhan + notification settings
    IntroNamaz.jsx       animated step-by-step namaz guide (English + Urdu)
    Ahadees.jsx          hadith books with Arabic, Urdu and English
    Attendance.jsx       prayer attendance, streak, heatmap
    Profile.jsx          private profile: own details, photo and activity
```

## Notes
- Accounts and attendance are stored on the device (localStorage) through `src/lib/storage.js`. With the lecture server connected, sign-in accounts live on the server.
- Quran Arabic is shown in Scheherazade New (Quranic script), set with `--arabic` in `src/App.css`.
- The Quran text comes from the Tanzil "Uthmani" edition through alquran.cloud. It is not typed into the app, so it needs an internet connection.
  For accounts that work across devices, replace the `db` functions with calls to a backend.
- Quran text/audio use alquran.cloud, prayer times use aladhan.com, so internet is required for the full experience.
- The adhan plays while the site is open in a tab (browsers require one click on the page first).

## The server (server/server.cjs)
A small server (no extra packages) keeps accounts, each member's own data and the prayer alerts.
- **Publisher / teacher** (only one account): the email in `ADMIN_EMAIL`, or the first account created if that is not set. Only the publisher can create and delete live classes.
- Each member receives their own prayer alerts.

Run it:
```bash
npm run server            # listens on http://localhost:8787
```
Then copy `.env.example` to `.env.local` (it already points at `http://localhost:8787`) and start the app with `npm run dev`.

To put it online, host the server on a Node.js host (Render, Railway, or a VPS). Set `ADMIN_EMAIL`, `DATA_DIR` (a persistent disk) and `CORS_ORIGIN` (your website address). Then set `VITE_API_URL` to the server address and run `npm run build`.
Videos are streamed from disk, so a 3 GB file works. Very large uploads also depend on the host's own upload limits.

## Backend API (server/server.cjs)
One file, no packages, Node 18+. Everything is stored as JSON files in `DATA_DIR`. All routes except register/login/social need `Authorization: Bearer <token>`.

| Route | What it does |
|---|---|
| `POST /api/register`, `/api/login`, `/api/auth/social` | create account, sign in (5 wrong passwords = 15 minute wait), Google/Apple sign-in |
| `GET /api/me` | who am I |
| `POST /api/logout` | ends this session on the server |
| `GET/PUT /api/me/data` | the member's own data: settings, attendance, completed surahs, bookmarks, last read, reciter, Quran preferences, history. The app pulls it when it opens and saves it 1.5 s after every change, so it follows the member to any device. If the server copy was changed on another device it wins. |
| `DELETE /api/me` | delete the account and its data |
| `GET /health` | health check for the host (returns `{ok:true}`) |
| `POST /api/push/subscribe`, `/unsubscribe`, `GET /api/push/key` | exact prayer alerts |

Environment: `PORT`, `DATA_DIR`, `ADMIN_EMAIL`, `CORS_ORIGIN` (one website, or several separated by commas), `SESSION_DAYS` (default 90), `GOOGLE_CLIENT_ID`, `APPLE_CLIENT_ID`.
Back up `DATA_DIR` to back up everything. For a very large community, move the JSON files to a database.

## Quran offline (one-time download)
The Quran page can work without internet once the full Quran is saved in the project.

1. Make sure you have internet and Node.js 18 or newer.
2. Run `npm run quran:download`. It downloads the Arabic, English and Urdu text and saves it to `src/data/quran.json` (about 450 KB).
3. Run `npm run quran:check`. It confirms 114 surahs and 6236 ayahs.
4. Run `npm run build` (or `npm run dev`). The app now uses the saved file first.

If the download fails, the script says why and exits. Run it again when the internet is working. Audio recitation still needs internet.

## Checking the Quran text
- `npm run quran:compare` compares every verse in `src/data/quran.json` with a second source (Quran.com). Spelling marks are ignored; only real word differences are reported.
- Use `npm run quran:compare -- 114` for one surah, or `-- 1-10` for a range.
- The result is saved to `scripts/quran-compare-report.txt`. Exit code 0 means no differences.

## Ahadees
- The **Ahadees** page covers Sahih al-Bukhari, Sahih Muslim, Sunan Abu Dawood, Jami at-Tirmidhi and Sunan Ibn Majah.
- The hadith text (Arabic, Urdu and English) and the chapter headings are loaded from the open fawazahmed0/hadith-api (jsDelivr CDN) when a book is opened. Nothing is typed into the app by hand, so the text is the source's text.
- Chapters are listed in the side panel. "Go to hadith no." jumps to any hadith number.
- Some editions or hadith numbers do not exist in every language, or are missing from the source. The page says so instead of showing an invented translation.
- Needs internet the first time each book is opened. Please check the Urdu and English text against a printed book for any doubtful hadith.

## Namaz recitations
The Intro To Namaz page has a player for the surahs used in Namaz (Al-Fatiha, Al-Kawthar, Al-Asr, An-Nasr, Al-Ikhlas, Al-Falaq, An-Nas), using the same audio as the Quran page. Needs internet.

## Urdu on the Ahadees page
- The Urdu editions are found from the source's own index of editions (editions.json) when the page opens. If a book has no Urdu edition in the source, the page says so.

## Adding Urdu translations to the Ahadees books
The open source does not have Urdu for every book (for example Sahih al-Bukhari). To add a complete Urdu translation:
1. Prepare a JSON file, using the hadith numbers shown in the app:
   `[ { "number": 1, "urdu": "..." }, { "number": 2, "urdu": "..." } ]`
2. Run `npm run hadith:urdu -- bukhari path\to\urdu-bukhari.json` (books: bukhari, muslim, abudawud, tirmidhi, ibnmajah).
3. Run `npm run build` (or restart `npm run dev`).
The import checks every entry and saves nothing if a problem is found. Use only a translation you have the right to use, and check it against a printed copy.

## Google and Apple sign-in
The buttons work once the developer details are added. Nothing else is needed in the code.

**Google**
1. In Google Cloud Console, create an OAuth client ID of type "Web application".
2. Under "Authorized JavaScript origins", add your website address (for example `https://pearlsofislam.netlify.app`) and `http://localhost:5173` for testing.
3. Put the client ID in two places:
   - `.env.local` on your computer, and on Netlify as the build variable: `VITE_GOOGLE_CLIENT_ID=...`
   - the lecture server's environment: `GOOGLE_CLIENT_ID=...`

**Apple**
1. In the Apple Developer account (paid), create an App ID and a Services ID, enable "Sign in with Apple" on the Services ID, and add your domain and return URL (your website address).
2. Verify the domain as Apple asks. Apple does not accept `localhost`, so test Apple sign-in on the live website only.
3. Put the Services ID in two places:
   - `.env.local` and the Netlify build variables: `VITE_APPLE_CLIENT_ID=...`
   - the lecture server's environment: `APPLE_CLIENT_ID=...`

After changing `VITE_` values, run `npm run build` again. The server checks every Google and Apple token itself before it signs anyone in.
## Quran Page view
On the Quran page, press **Page view** to show a surah as one page: each ayah is one line of Arabic (Quranic font), with its English and Urdu translation directly under it. Press **Print this page** to print the surah. Press **Verse view** to go back to the ayah cards.

## Exact prayer alerts (even when the app is closed)
- The first time the app opens, it asks for the phone's location once and uses it for prayer times.
- On the **Prayers** page press **Turn on exact prayer alerts**. The phone then receives a push from the lecture server at each prayer time (and the reminder, if set), and shows a notification even when the app is closed.
- The server works out prayer times from the phone's location and the chosen calculation method. It uses the same service as the app (aladhan.com), and calculates the times itself if that service is unreachable.
- Requirements:
  - The app must be on an **https** address (Netlify is fine) and the lecture server must be running all the time (a host with a persistent disk).
  - **Android (Chrome):** allow notifications, and turn off battery optimisation for the browser if alerts arrive late.
  - **iPhone:** iOS 16.4 or later. Open the site in Safari, tap Share, choose "Add to Home Screen", open the app from the Home Screen, then turn the alerts on.
- The notification uses the phone's own notification sound. A recording of the azan plays only while the app is open. For the azan sound in the background, the app would need to be packaged as a native app (see the Capacitor notes).
- Timing is accurate to within a few seconds. Network delay can add a little more.
- Server settings (optional): `ALADHAN_BASE`, `VAPID_SUBJECT`. The push keys are created automatically the first time the server starts, and saved in `data/vapid.json`. Keep that file private and keep it when you redeploy.

## Moving gradient circles
- Four soft, blurred green circles drift slowly behind the content, in dark and light themes.
- They are made with CSS only, move with `transform` (smooth on phones), and stop moving for people who ask for reduced motion.
- To change speed or colour, edit the `.orbs` rules and the `--orb-a` / `--orb-b` values at the end of `src/App.css`. To remove them, delete the `<div className="orbs">` line in `src/App.jsx`.

## Use it as an app
**Install from the browser (PWA)** - host the `dist` folder on any https site (Netlify, Vercel, GitHub Pages):
```bash
npm run build
```
Drag the `dist` folder onto https://app.netlify.com/drop. Open the site on your phone, then
Chrome menu -> "Install app" (or the Install button on the Home screen). iPhone: Share -> "Add to Home Screen".

**Android APK (Capacitor)**
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npm run build
npx cap add android
npx cap sync
npx cap open android      # opens Android Studio, then Build -> Build APK
```

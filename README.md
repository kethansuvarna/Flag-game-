# Louise's Flag Game

A flag-guessing game covering all 196 countries, installable as a Home Screen app on iPhone with offline support.

---

## What changed in this update (PWA upgrade)

This update turns the existing game into an installable, offline-capable Progressive Web App. **No gameplay, scoring, map, or mechanics were changed or removed** — every existing feature (the map, search, continent browser, hints, heat-map, streak scoring, leaderboard, etc.) works exactly as before. Only the following were added:

| File | Status | Purpose |
|---|---|---|
| `index.html` | **Modified** | Added manifest link, Apple PWA meta tags, Apple touch icon, safe-area padding (notch/Dynamic Island/home indicator), `prefers-reduced-motion` support, tap-callout prevention, and the service worker registration script. The actual game code is untouched. |
| `manifest.json` | **New** | The web app manifest (name, icons, colors, standalone display mode). |
| `service-worker.js` | **New** | Handles offline caching (see below). |
| `icons/icon-180.png` | **New** | Apple Touch Icon (iOS Home Screen). |
| `icons/icon-192.png` | **New** | Standard PWA icon. |
| `icons/icon-512.png` | **New** | Standard PWA icon (large). |
| `icons/icon-512-maskable.png` | **New** | Maskable icon (safe-zone padded so Android/other OS icon shapes don't crop it). |

All new files use **relative paths** throughout (`./`, `icons/...`, `manifest.json`) — nothing is hardcoded to a domain root, so this works correctly under your GitHub Pages project path (`/Flag-game-/`) without any changes.

---

## How to host it on GitHub Pages

1. In your `Flag-game-` repository, upload these files to the **root**, preserving the folder structure:
   - `index.html` (replace your existing one)
   - `manifest.json`
   - `service-worker.js`
   - an `icons` folder containing all four `.png` files
2. If you're using the GitHub web UI: **Add file → Upload files**, then drag in `index.html`, `manifest.json`, and `service-worker.js` together, then separately create the `icons/` folder the same way (GitHub will create the folder automatically if you drag the icon files in with `icons/` typed as part of the path, or upload them into a folder you create via "Create new file" → type `icons/icon-180.png` as the filename once, which creates the folder).
3. Commit. GitHub Pages redeploys automatically within about a minute at your existing URL:
   `https://kethansuvarna.github.io/Flag-game-/`
4. No changes to your Pages settings are needed — it already serves from the repo root, which is what all the new relative paths assume.

---

## Installing on iPhone (Add to Home Screen)

1. Open **`https://kethansuvarna.github.io/Flag-game-/`** in **Safari** (must be Safari — Chrome/Firefox on iOS can't install PWAs).
2. Tap the **Share** icon (square with an arrow pointing up) in the toolbar.
3. Scroll down and tap **Add to Home Screen**.
4. iOS will show a preview with the app name ("Flag Game") and the icon — tap **Add** (top right).
5. Launch the game from the new icon on your Home Screen, the same as any other app.

When launched from the Home Screen icon, it opens full-screen with no Safari address bar/toolbar (`display: standalone`), uses your custom icon, and the status bar area is handled via the safe-area CSS so content doesn't sit under the notch/Dynamic Island.

**Note on iOS specifics:** iOS does not use the `display`/icon fields from `manifest.json` the way Android does — that's why the Apple-specific meta tags and the separate `apple-touch-icon` link are there too. The "Open as Web App" toggle mentioned in some general PWA guides doesn't exist as a separate step on current iOS versions — Safari's **Add to Home Screen** already installs it as a standalone web app automatically.

---

## Testing offline functionality

1. Open the installed app (or the site in Safari) **at least once with an internet connection**, and let it fully load (flag emoji, map, everything visible) — this is what populates the offline cache.
2. Turn on **Airplane Mode** (or otherwise disconnect from the internet).
3. Close and reopen the app from the Home Screen icon.
4. The game should load and be fully playable — map, flags, guessing, hints, and the heat-map should all work normally.

**What won't work offline** (by design, since they need a live connection): the optional shared Firebase leaderboard (if you've set it up) will fail silently and the game falls back to not updating the leaderboard until you're back online; nothing else in the game depends on a connection.

---

## Updating the installed app in the future

1. Make your changes to `index.html` (or any other file) and re-upload/commit to GitHub as usual.
2. **Open `service-worker.js` and change `CACHE_VERSION` to a new value** (e.g. `"v1"` → `"v2"`). This is the one manual step — it tells the service worker a new version exists and to discard the old cache.
3. Commit and push. GitHub Pages redeploys within about a minute.
4. The next time the player opens the installed app **with an internet connection**, the new version downloads in the background, takes over immediately, and the app auto-reloads once to show it. They don't need to delete and reinstall anything.

If you forget to bump `CACHE_VERSION`, the service worker will still fetch your new `index.html` (it's network-first), but some unchanged cached assets won't be explicitly refreshed until they naturally fall out of cache — bumping the version guarantees a clean slate.

---

## Making the leaderboard shared across everyone (optional)

By default, the top-10 leaderboard is saved only in each player's own browser (`localStorage`) — a static site with no server can't share data between devices on its own.

To make it a real, shared leaderboard everyone contributes to, connect a free Firebase Realtime Database (no credit card required):

1. Go to [console.firebase.google.com](https://console.firebase.google.com), sign in with a Google account, and click **Add project**. Give it any name (e.g. "louises-flag-game") and finish the wizard (you can turn off Google Analytics for this project, it's not needed).
2. In the left sidebar, go to **Build → Realtime Database**, click **Create Database**, choose a location, and start in **test mode** for now (we'll lock it down with the rule below).
3. Once created, click the **Rules** tab and replace the contents with:
   ```json
   {
     "rules": {
       "leaderboard": {
         ".read": true,
         "$entryId": {
           ".write": "!data.exists() && newData.hasChildren(['name','score','ts']) && newData.child('name').isString() && newData.child('name').val().length <= 20 && newData.child('score').isNumber() && newData.child('score').val() >= 0 && newData.child('score').val() <= 196"
         }
       }
     }
   }
   ```
   This lets anyone *read* the leaderboard and *add* a new score, but not edit or delete existing entries, and only accepts realistically-shaped scores. Click **Publish**.
4. Go to **Project settings** (gear icon, top left) → scroll to **Your apps** → click the **</>** (web) icon → register an app (any nickname) → **Firebase Hosting is not required, skip it**.
5. Firebase will show you a `firebaseConfig` object with values for `apiKey`, `authDomain`, `databaseURL`, and `projectId`.
6. Open `index.html`, find the `FIREBASE_CONFIG` object near the top of the `<script>` section, and paste in your four values in place of the `YOUR_...` placeholders.
7. Re-upload `index.html` to GitHub. The leaderboard note under the trophy will now say "Shared leaderboard" instead of "Saved on this device only," and everyone who plays will see and contribute to the same top 10.

If you skip this setup, the game works exactly as before with a per-device leaderboard — nothing is required to break.

---

## Limitations and what's unverified

I don't have a real iPhone, Safari, or browser available in this environment to actually install and test the app — everything below was built and validated as carefully as I could (JSON syntax checked, JavaScript syntax checked, every file path cross-checked against the files actually created, the service worker logic written to the standard, well-established patterns for this exact use case), but **I have not been able to personally verify these by installing and running it**:

- Actual installability via Safari's "Add to Home Screen" flow on a real device
- Real-world offline behavior after a genuine first load and disconnect
- Whether iOS's specific caching/storage quotas affect the map data (the world map JSON is a few hundred KB, which is comfortably within normal service worker cache limits, but this is based on general knowledge rather than a live test)
- Visual correctness of the safe-area padding on an actual notched/Dynamic-Island device

**Please test these yourself after deploying** using the steps above, and let me know what you find — especially anything that doesn't behave as described, since I can't catch runtime-only issues from here.

### Other known limitations
- Requires an internet connection the *first* time it's installed/loaded, to download the game and populate the offline cache. After that, it works offline.
- The optional shared leaderboard (Firebase) only works online, by nature — it's live, shared data.
- iOS does not support native "install app update" prompts the way some Android browsers do; updates apply automatically on next online launch (see "Updating the installed app" above), not instantly while the app is already open.

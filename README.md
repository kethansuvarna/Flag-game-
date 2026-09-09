# Louise's Flag Game

A single-file, offline-friendly flag-guessing game covering all 196 countries.

## How to play locally
Just open `index.html` (or `louisesflaggame.html`) in Safari, Chrome, or any modern browser.
No build step, no server, no dependencies to install.

## How to host it for free on GitHub Pages
1. Create a new public GitHub repository.
2. Upload `index.html` to the root of that repository.
3. In the repo, go to **Settings → Pages**, set the source branch to `main` (folder `/root`), and save.
4. GitHub will give you a live URL like `https://yourusername.github.io/your-repo-name/` within a minute or two.
5. Share that link with anyone — it works on any device with a browser, no download needed.

## Updating an existing repo with a new version
1. Open your repo on github.com and click `index.html`.
2. Go back to the repo's main page, click **Add file → Upload files**, drag in the new `index.html`, and GitHub will offer to replace the existing one.
3. Click **Commit changes**. GitHub Pages redeploys automatically within about a minute — no other settings need to change.

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
7. Re-upload `index.html` to GitHub (see "Updating an existing repo" above). That's it — the leaderboard note under the trophy will now say "Shared leaderboard" instead of "Saved on this device only," and everyone who plays will see and contribute to the same top 10.

If you skip this setup, the game works exactly as before with a per-device leaderboard — nothing is required to break.

## Notes
- Requires an internet connection the first time it loads (it pulls in the world map data and a couple of fonts from public CDNs). After that it runs entirely client-side.
- Without the Firebase setup above, the leaderboard is local to each device/browser only.

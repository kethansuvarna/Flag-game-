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

## Notes
- Requires an internet connection the first time it loads (it pulls in the world map data and a couple of fonts from public CDNs). After that it runs entirely client-side.
- The leaderboard is stored in each player's own browser (`localStorage`) — it is **not** shared across devices or between players. Two people playing on two different phones will each have their own separate top-10 list.

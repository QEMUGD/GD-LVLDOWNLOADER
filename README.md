# GD-LVLDOWNLOADER

A browser-only Geometry Dash level-data downloader. The site is hosted on GitHub Pages and sends requests directly from the browser to Boomlings. There is no backend, proxy, Node.js, or npm.

## Publish the website

1. Open this repository's **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Open the **Actions** tab and wait for the **Deploy static site to GitHub Pages** workflow to finish successfully.
4. Visit https://qemugd.github.io/GD-LVLDOWNLOADER/

The workflow publishes the `public/` folder. If the URL displays this README instead of the downloader, GitHub Pages is probably still configured to publish the repository root or the Actions deployment has not completed.

## Browser-only download notes

- The page sends a direct POST request to Boomlings' `downloadGJLevel22.php` endpoint.
- Some browsers block this request because of CORS. A compatible browser extension may help, but the website itself cannot override browser CORS security.
- No public proxy or backend is used.
- Only publicly downloadable levels can be retrieved.
- The `.gdlvl` extension is this project's filename for raw level-string text; it is not claimed to be an official Geometry Dash import format.

Unofficial community utility; not affiliated with RobTop Games.

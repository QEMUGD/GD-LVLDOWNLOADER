# GD-LVLDOWNLOADER

A mobile-friendly Geometry Dash level-data downloader. The public website is hosted with GitHub Pages; a Cloudflare Worker proxies requests to Boomlings. No local server, terminal, Node.js, or npm is needed to use the deployed site.

## One-time setup (phone-friendly)

### 1. Deploy the website with GitHub Pages

1. Open this repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. The workflow in `.github/workflows/pages.yml` will publish the `public` folder.
5. When the workflow finishes, the website will be at:
   https://qemugd.github.io/GD-LVLDOWNLOADER/

### 2. Deploy the Boomlings proxy with Cloudflare Workers

1. Sign in to Cloudflare and open **Workers & Pages**.
2. Choose **Create → Worker** and give it a name such as `gd-lvldownloader`.
3. Open **Edit code**.
4. Replace the sample code with the complete contents of `worker.js` from this repository.
5. Press **Deploy**. Cloudflare will show a URL similar to `https://gd-lvldownloader.YOUR-SUBDOMAIN.workers.dev`.

### 3. Connect the website to your Worker

1. Open `public/index.html` in GitHub.
2. Tap the pencil (Edit) button.
3. Find the line beginning `const API_URL =`.
4. Replace the placeholder with your exact Worker URL, for example:
   `const API_URL = "https://gd-lvldownloader.YOUR-SUBDOMAIN.workers.dev";`
   Do not add `/api/download` to the end.
5. Commit the change. GitHub Pages will automatically publish the update.

## Notes

- Only levels made available by the Geometry Dash server can be retrieved.
- The app does not ask for or store your Geometry Dash password.
- The `.gdlvl` extension is this project's filename for the raw level-string text; it is not claimed to be an official Geometry Dash import format.
- Boomlings' server protocol and availability can change.

Unofficial community utility; not affiliated with RobTop Games.

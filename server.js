const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const PUBLIC_DIR = path.join(__dirname, "public");
const GD_ENDPOINT = "https://www.boomlings.com/database/downloadGJLevel22.php";
const MAX_BODY_BYTES = 2048;
const REQUEST_TIMEOUT_MS = 20000;
const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

function sendJson(res, statusCode, payload) {
  if (res.headersSent) return;
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(payload));
}

function parseLevel(raw) {
  // The level record is the first # section. Its colon-separated
  // key/value fields include 2 = level name and 4 = level string.
  const record = String(raw || "").trim().split("#", 1)[0];
  const parts = record.split(":");
  const fields = Object.create(null);

  for (let i = 0; i + 1 < parts.length; i += 2) {
    fields[parts[i]] = parts[i + 1];
  }

  const name = fields["2"] || "Untitled level";
  const data = fields["4"];

  if (!data || data === "-1" || data.length < 2) {
    throw new Error("The server did not return level data. Check the ID, or the level may be unavailable.");
  }

  return { name, data };
}

async function requestLevel(levelID) {
  const form = new URLSearchParams({
    gameVersion: "22",
    binaryVersion: "42",
    gdw: "0",
    accountID: "0",
    gjp2: "",
    levelID,
    secret: "Wmfd2893gb7"
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(GD_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "GeometryDash/2.2081",
        "Accept": "*/*"
      },
      body: form.toString(),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error("Boomlings responded with HTTP " + response.status + ".");
    }

    const raw = await response.text();

    if (Buffer.byteLength(raw, "utf8") > MAX_RESPONSE_BYTES) {
      throw new Error("The response from Boomlings was too large.");
    }
    if (!raw || raw.trim() === "-1") {
      throw new Error("Boomlings could not find that level. It may be private, deleted, or unavailable.");
    }

    return parseLevel(raw);
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Boomlings timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function serveStatic(req, res) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400);
    return res.end("Bad request");
  }

  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = path.resolve(PUBLIC_DIR, relative);

  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }

    res.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache"
    });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJson(res, 200, { ok: true, service: "GD-LVLDOWNLOADER" });
  }

  if (req.method === "POST" && url.pathname === "/api/download") {
    let body = "";
    let tooLarge = false;

    req.on("data", chunk => {
      body += chunk.toString("utf8");
      if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
        tooLarge = true;
        sendJson(res, 413, { error: "Request too large." });
        req.destroy();
      }
    });

    req.on("end", async () => {
      if (tooLarge) return;

      const params = new URLSearchParams(body);
      const levelID = (params.get("levelID") || "").trim();

      if (!/^\d{1,15}$/.test(levelID) || /^0+$/.test(levelID)) {
        return sendJson(res, 400, { error: "Enter a valid numeric Geometry Dash level ID." });
      }

      try {
        const level = await requestLevel(levelID);
        return sendJson(res, 200, {
          success: true,
          id: levelID,
          name: level.name,
          data: level.data
        });
      } catch (error) {
        console.error("[download]", error.message);
        return sendJson(res, 502, { error: error.message || "Level download failed." });
      }
    });

    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD, POST" });
    return res.end("Method not allowed");
  }

  serveStatic(req, res);
});

server.listen(PORT, HOST, () => {
  console.log("GD-LVLDOWNLOADER running at http://localhost:" + PORT);
});

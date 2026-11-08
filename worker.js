const GD_ENDPOINT = "https://www.boomlings.com/database/downloadGJLevel22.php";
const ALLOWED_ORIGIN = "https://qemugd.github.io";

function json(data, status = 200, origin = ALLOWED_ORIGIN) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    }
  });
}

function parseLevel(raw) {
  const record = String(raw || "").trim().split("#", 1)[0];
  const parts = record.split(":");
  const fields = Object.create(null);

  for (let i = 0; i + 1 < parts.length; i += 2) {
    fields[parts[i]] = parts[i + 1];
  }

  const data = fields["4"];
  if (!data || data === "-1" || data.length < 2) {
    throw new Error("No level data returned. Check the ID or try a publicly available level.");
  }

  return { name: fields["2"] || "Untitled level", data };
}

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "";
    if (origin !== ALLOWED_ORIGIN) {
      return new Response("Origin not allowed", { status: 403 });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin"
        }
      });
    }

    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/api/download") {
      return json({ error: "Not found" }, 404);
    }

    let form;
    try {
      const text = await request.text();
      if (text.length > 2048) return json({ error: "Request too large." }, 413);
      form = new URLSearchParams(text);
    } catch {
      return json({ error: "Invalid request body." }, 400);
    }

    const levelID = (form.get("levelID") || "").trim();
    if (!/^\\d{1,15}$/.test(levelID) || /^0+$/.test(levelID)) {
      return json({ error: "Enter a valid numeric Geometry Dash level ID." }, 400);
    }

    try {
      const body = new URLSearchParams({
        gameVersion: "22",
        binaryVersion: "42",
        gdw: "0",
        accountID: "0",
        gjp2: "",
        levelID,
        secret: "Wmfd2893gb7"
      });

      const upstream = await fetch(GD_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "GeometryDash/2.2081",
          "Accept": "*/*"
        },
        body: body.toString(),
        signal: AbortSignal.timeout(20000)
      });

      if (!upstream.ok) {
        return json({ error: "Boomlings returned HTTP " + upstream.status + "." }, 502);
      }

      const raw = await upstream.text();
      if (!raw || raw.trim() === "-1") {
        return json({ error: "Boomlings could not find that level. It may be private, deleted, or unavailable." }, 404);
      }
      if (raw.length > 8 * 1024 * 1024) {
        return json({ error: "The level response was too large." }, 502);
      }

      const level = parseLevel(raw);
      return json({ success: true, id: levelID, name: level.name, data: level.data });
    } catch (error) {
      const message = error.name === "TimeoutError" || error.name === "AbortError"
        ? "Boomlings timed out. Please try again."
        : (error.message || "The level download failed.");
      return json({ error: message }, 502);
    }
  }
};

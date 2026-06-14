const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content");
const EDITOR_DIR = path.join(__dirname, "site-editor");
const PORT = Number(process.env.PORT || 5177);

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024 * 4) {
        reject(new Error("Request body too large."));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function listJsonFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listJsonFiles(fullPath);
    }

    return entry.isFile() && entry.name.endsWith(".json") ? [fullPath] : [];
  });
}

function loadAllContent() {
  return {
    site: readJson(path.join(CONTENT_DIR, "site.json")),
    games: listJsonFiles(path.join(CONTENT_DIR, "games")).map(readJson).sort((a, b) => a.slug.localeCompare(b.slug)),
    posts: listJsonFiles(path.join(CONTENT_DIR, "posts")).map(readJson).sort((a, b) => `${b.date}-${b.slug}`.localeCompare(`${a.date}-${a.slug}`)),
    pages: listJsonFiles(path.join(CONTENT_DIR, "pages")).map(readJson).sort((a, b) => `${a.lang}-${a.page}`.localeCompare(`${b.lang}-${b.page}`))
  };
}

function safeSlug(value) {
  const slug = String(value || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!slug) {
    throw new Error("Slug is required.");
  }

  return slug;
}

function saveAllContent(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid payload.");
  }

  writeJson(path.join(CONTENT_DIR, "site.json"), payload.site);

  const gamesDir = path.join(CONTENT_DIR, "games");
  fs.mkdirSync(gamesDir, { recursive: true });
  for (const filePath of listJsonFiles(gamesDir)) {
    fs.rmSync(filePath, { force: true });
  }

  for (const game of payload.games || []) {
    game.slug = safeSlug(game.slug);
    writeJson(path.join(gamesDir, `${game.slug}.json`), game);
  }

  const postsRoot = path.join(CONTENT_DIR, "posts");
  fs.mkdirSync(postsRoot, { recursive: true });
  for (const filePath of listJsonFiles(postsRoot)) {
    fs.rmSync(filePath, { force: true });
  }

  for (const post of payload.posts || []) {
    post.game = safeSlug(post.game);
    post.slug = safeSlug(post.slug);
    const postDir = path.join(CONTENT_DIR, "posts", post.game);
    writeJson(path.join(postDir, `${post.slug}.json`), post);
  }

  const pagesDir = path.join(CONTENT_DIR, "pages");
  fs.mkdirSync(pagesDir, { recursive: true });
  for (const filePath of listJsonFiles(pagesDir)) {
    fs.rmSync(filePath, { force: true });
  }

  for (const page of payload.pages || []) {
    const lang = safeSlug(page.lang);
    const pageName = safeSlug(page.page);
    const gameName = page.game ? `${safeSlug(page.game)}-` : "";
    writeJson(path.join(pagesDir, `${lang}-${gameName}${pageName}.json`), page);
  }
}

function buildSite() {
  const result = spawnSync(process.execPath, [path.join(__dirname, "build-site.js")], {
    cwd: ROOT,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "Build failed.");
  }

  return result.stdout.trim();
}

function uploadAsset(payload) {
  const fileName = String(payload.fileName || "").replace(/[^a-zA-Z0-9._-]/g, "-");
  const dataUrl = String(payload.dataUrl || "");
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!fileName || !match) {
    throw new Error("Invalid upload payload.");
  }

  const ext = path.extname(fileName).toLowerCase();
  if (![".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".mp4", ".webm"].includes(ext)) {
    throw new Error("Unsupported asset type.");
  }

  const targetDir = path.join(ROOT, "assets", "uploads");
  fs.mkdirSync(targetDir, { recursive: true });
  const target = path.join(targetDir, `${Date.now()}-${fileName}`);
  fs.writeFileSync(target, Buffer.from(match[2], "base64"));
  return `/assets/uploads/${path.basename(target)}`;
}

function serveFile(res, filePath) {
  if (!filePath.startsWith(ROOT) && !filePath.startsWith(EDITOR_DIR)) {
    send(res, 403, "Forbidden", "text/plain; charset=utf-8");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    send(res, 404, "Not found", "text/plain; charset=utf-8");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const type = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".xml": "application/xml; charset=utf-8",
    ".ico": "image/x-icon"
  }[ext] || "application/octet-stream";

  send(res, 200, fs.readFileSync(filePath), type);
}

async function handle(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  try {
    if (req.method === "GET" && url.pathname === "/api/content") {
      send(res, 200, JSON.stringify(loadAllContent()));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/save") {
      saveAllContent(JSON.parse(await readBody(req)));
      send(res, 200, JSON.stringify({ ok: true }));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/build") {
      const output = buildSite();
      send(res, 200, JSON.stringify({ ok: true, output }));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/upload-asset") {
      const publicPath = uploadAsset(JSON.parse(await readBody(req)));
      send(res, 200, JSON.stringify({ ok: true, path: publicPath }));
      return;
    }

    if (url.pathname === "/" || url.pathname === "/editor/") {
      serveFile(res, path.join(EDITOR_DIR, "index.html"));
      return;
    }

    if (url.pathname.startsWith("/editor/")) {
      serveFile(res, path.join(EDITOR_DIR, url.pathname.replace("/editor/", "")));
      return;
    }

    const sitePath = url.pathname.endsWith("/")
      ? path.join(ROOT, url.pathname, "index.html")
      : path.join(ROOT, url.pathname);
    serveFile(res, sitePath);
  } catch (error) {
    send(res, 500, JSON.stringify({ ok: false, error: error.message }));
  }
}

http.createServer(handle).listen(PORT, "127.0.0.1", () => {
  console.log(`CopiaSoft editor: http://localhost:${PORT}`);
  console.log(`Preview KO: http://localhost:${PORT}/ko/`);
});

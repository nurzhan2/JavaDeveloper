// Сервер без зависимостей: раздаёт сайт и хранит прогресс в JSON.
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const VOLUME = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || "";
const DATA_DIR = VOLUME || path.join(__dirname, "data");
const PERSISTENT = Boolean(VOLUME);
const DATA_FILE = path.join(DATA_DIR, "state.json");
const PASSWORD = process.env.APP_PASSWORD || "";
const PUBLIC = path.join(__dirname, "public");
const MAX_BODY = 1024 * 1024;

fs.mkdirSync(DATA_DIR, { recursive: true });

const empty = () => ({ tasks: {}, notes: {}, settings: {} });

function loadState() {
  try {
    if (!fs.existsSync(DATA_FILE)) return empty();
    const s = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return { ...empty(), ...s };
  } catch (e) {
    // Битый файл не роняет сервер: откладываем его и начинаем заново.
    const bad = DATA_FILE + ".corrupt-" + Date.now();
    try { fs.renameSync(DATA_FILE, bad); } catch {}
    console.error("state.json повреждён, сохранён как", bad);
    return empty();
  }
}

let state = loadState();
let writing = Promise.resolve();

function saveState() {
  // Атомарная запись по очереди: tmp-файл → rename.
  writing = writing.then(() => new Promise(res => {
    const tmp = DATA_FILE + ".tmp";
    fs.writeFile(tmp, JSON.stringify(state), err => {
      if (err) { console.error(err); return res(); }
      fs.rename(tmp, DATA_FILE, e => { if (e) console.error(e); res(); });
    });
  }));
  return writing;
}

// Слияние по каждому ключу: побеждает запись с большим временем t.
function mergeMap(a = {}, b = {}) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (!v || typeof v !== "object" || typeof v.t !== "number") continue;
    if (!out[k] || out[k].t < v.t) out[k] = v;
  }
  return out;
}
function merge(a, b) {
  return {
    tasks: mergeMap(a.tasks, b.tasks),
    notes: mergeMap(a.notes, b.notes),
    settings: mergeMap(a.settings, b.settings)
  };
}

function authorized(req) {
  if (!PASSWORD) return true;
  const got = Buffer.from(String(req.headers["x-app-key"] || ""));
  const want = Buffer.from(PASSWORD);
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

function send(res, code, body, headers = {}) {
  const isObj = typeof body === "object" && !Buffer.isBuffer(body);
  res.writeHead(code, { "Content-Type": isObj ? "application/json; charset=utf-8" : "text/plain; charset=utf-8", ...headers });
  res.end(isObj ? JSON.stringify(body) : body);
}

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".json": "application/json", ".webmanifest": "application/manifest+json" };

function serveStatic(req, res) {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/") p = "/index.html";
  const file = path.normalize(path.join(PUBLIC, p));
  if (!file.startsWith(PUBLIC)) return send(res, 403, "Forbidden");
  fs.stat(file, (err, st) => {
    const target = !err && st.isFile() ? file : path.join(PUBLIC, "index.html");
    const ext = path.extname(target);
    res.writeHead(200, {
      "Content-Type": TYPES[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=300"
    });
    fs.createReadStream(target).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");

  if (url.pathname === "/api/health")
    return send(res, 200, { ok: true, persistent: PERSISTENT, protected: Boolean(PASSWORD) });

  if (url.pathname === "/api/state") {
    if (!authorized(req)) return send(res, 401, { error: "wrong_password" });
    if (req.method === "GET") return send(res, 200, state);
    if (req.method === "PUT") {
      let size = 0, chunks = [];
      req.on("data", c => {
        size += c.length;
        if (size > MAX_BODY) { send(res, 413, { error: "too_large" }); req.destroy(); }
        else chunks.push(c);
      });
      req.on("end", async () => {
        if (res.writableEnded) return;
        let incoming;
        try { incoming = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
        catch { return send(res, 400, { error: "bad_json" }); }
        state = merge(state, incoming || {});
        await saveState();
        send(res, 200, state);
      });
      return;
    }
    return send(res, 405, { error: "method" });
  }

  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Method not allowed");
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`JavaDeveloper plan on :${PORT} | data: ${DATA_FILE} | persistent: ${PERSISTENT} | password: ${PASSWORD ? "on" : "off"}`);
});

process.on("SIGTERM", () => writing.then(() => process.exit(0)));

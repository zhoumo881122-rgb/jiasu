const childProcess = require("child_process");
const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "..");
const requiredFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "server.js",
  "robots.txt",
  "sitemap.xml"
];

const htmlFiles = requiredFiles.filter((file) => file.endsWith(".html"));
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function fileExists(file) {
  return fs.existsSync(path.join(root, file));
}

function checkSyntax(file) {
  const result = childProcess.spawnSync(process.execPath, ["--check", path.join(root, file)], {
    encoding: "utf8"
  });
  assert(result.status === 0, `${file} has a syntax error:\n${result.stderr || result.stdout}`);
}

function checkRequiredFiles() {
  requiredFiles.forEach((file) => assert(fileExists(file), `Missing required file: ${file}`));
}

function checkHtmlMetadata() {
  htmlFiles.forEach((file) => {
    const html = read(file);
    assert(/<title>[^<]{10,}<\/title>/i.test(html), `${file} is missing a useful title`);
    assert(/<meta\s+name="description"\s+content="[^"]{20,}"/i.test(html), `${file} is missing a useful meta description`);
    assert(!/[�]/.test(html), `${file} contains replacement characters`);
  });
}

function checkInternalLinks() {
  const linkPattern = /\b(?:href|src)="([^"]+)"/g;
  htmlFiles.forEach((file) => {
    const html = read(file);
    for (const match of html.matchAll(linkPattern)) {
      const target = match[1];
      if (/^(https?:|mailto:|tel:|#|\/)/.test(target)) continue;
      const localPath = target.split("#")[0].split("?")[0];
      if (!localPath) continue;
      assert(fileExists(localPath), `${file} links to missing file: ${target}`);
    }
  });
}

function checkSeoFiles() {
  const sitemap = read("sitemap.xml");
  const robots = read("robots.txt");
  requiredFiles
    .filter((file) => file.endsWith(".html"))
    .forEach((file) => assert(sitemap.includes(file) || file === "index.html", `sitemap.xml is missing ${file}`));
  assert(robots.includes("Sitemap:"), "robots.txt must include Sitemap");
  assert(sitemap.includes("https://www.lanhaijiedian.com/"), "sitemap.xml must include the canonical homepage");
  assert(sitemap.includes("hreflang=\"zh-CN\""), "sitemap.xml must include zh-CN hreflang");
  assert(sitemap.includes("hreflang=\"en\""), "sitemap.xml must include en hreflang");
}

function request(port, pathname) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: "127.0.0.1", port, path: pathname, timeout: 5000 }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy(new Error(`Timeout requesting ${pathname}`));
    });
  });
}

async function checkServer() {
  const port = 49217;
  const server = childProcess.spawn(process.execPath, [path.join(root, "server.js")], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"]
  });

  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Server did not start")), 5000);
      server.stdout.on("data", (chunk) => {
        if (String(chunk).includes(`127.0.0.1:${port}`)) {
          clearTimeout(timer);
          resolve();
        }
      });
      server.on("error", reject);
      server.on("exit", (code) => reject(new Error(`Server exited early with code ${code}`)));
    });

    for (const page of ["/", "/robots.txt", "/sitemap.xml"]) {
      const response = await request(port, page);
      assert(response.status === 200, `${page} returned HTTP ${response.status}`);
      assert(response.body.length > 20, `${page} returned an unexpectedly small response`);
    }
  } finally {
    server.kill();
  }
}

async function main() {
  checkRequiredFiles();
  checkSyntax("app.js");
  checkSyntax("server.js");
  checkHtmlMetadata();
  checkInternalLinks();
  checkSeoFiles();
  await checkServer();

  if (failures.length) {
    console.error(failures.map((failure) => `- ${failure}`).join("\n"));
    process.exit(1);
  }

  console.log("All static checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

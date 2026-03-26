import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { URL } from "node:url";

const [distRoot, host, portValue, stateFile] = process.argv.slice(2);

if (!distRoot || !host || !portValue || !stateFile) {
  process.exit(1);
}

const port = Number(portValue);
const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", `http://${host}:${port}`);
    const file = await resolveRequestFile(distRoot, requestUrl.pathname);
    const content = await fs.readFile(file);
    response.writeHead(200, { "Content-Type": contentType(file) });
    response.end(content);
  } catch {
    try {
      const notFound = path.join(distRoot, "404.html");
      const content = await fs.readFile(notFound);
      response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      response.end(content);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
  }
});

server.listen(port, host, async () => {
  await fs.mkdir(path.dirname(stateFile), { recursive: true });
  await fs.writeFile(
    stateFile,
    JSON.stringify({
      pid: process.pid,
      host,
      port,
      url: `http://${host}:${port}/`,
      distRoot,
      startedAt: new Date().toISOString()
    }, null, 2),
    "utf8"
  );
});

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, async () => {
    await cleanup();
    process.exit(0);
  });
}

process.on("exit", () => {
  void cleanup();
});

async function cleanup() {
  try {
    await fs.rm(stateFile, { force: true });
  } catch {
    // ignore
  }
}

async function resolveRequestFile(root: string, pathname: string): Promise<string> {
  const normalized = decodeURIComponent(pathname === "/" ? "/index.html" : pathname);
  const baseCandidate = path.join(root, normalized);
  const candidates = normalized.endsWith("/")
    ? [path.join(root, normalized, "index.html")]
    : [
        baseCandidate,
        `${baseCandidate}.html`,
        path.join(baseCandidate, "index.html")
      ];

  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile()) {
        return candidate;
      }
    } catch {
      // ignore
    }
  }

  throw new Error("not found");
}

function contentType(file: string): string {
  const ext = path.extname(file).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".woff2":
      return "font/woff2";
    default:
      return "application/octet-stream";
  }
}

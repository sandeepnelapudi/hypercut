#!/usr/bin/env node
// Minimal static server for local preview and end-to-end tests.
// Serves /dist with the same security headers as production. Blocks path traversal.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2',
};
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self' blob: data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";
const SEC = {
  'Content-Security-Policy': CSP, 'X-Frame-Options': 'DENY', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()', 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Resource-Policy': 'same-origin',
};

export function resolveSafe(urlPath) {
  let p;
  try { p = decodeURIComponent(urlPath.split('?')[0].split('#')[0]); } catch { return null; }
  if (p.includes('\0')) return null;
  const full = path.resolve(ROOT, '.' + path.posix.normalize('/' + p));
  if (full !== ROOT && !full.startsWith(ROOT + path.sep)) return null;
  return full;
}

export function createServer() {
  return http.createServer(async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD', ...SEC }); return res.end(); }
    let file = resolveSafe(req.url || '/');
    if (!file) { res.writeHead(400, SEC); return res.end('Bad request'); }
    try {
      let s = await stat(file).catch(() => null);
      if (s && s.isDirectory()) {
        if (!req.url.split('?')[0].endsWith('/')) { res.writeHead(301, { Location: req.url.split('?')[0] + '/' + (req.url.includes('?') ? '?' + req.url.split('?')[1] : ''), ...SEC }); return res.end(); }
        file = path.join(file, 'index.html'); s = await stat(file).catch(() => null);
      }
      if (!s || !s.isFile()) {
        const body = await readFile(path.join(ROOT, '404.html'));
        res.writeHead(404, { 'Content-Type': TYPES['.html'], ...SEC });
        return res.end(req.method === 'HEAD' ? undefined : body);
      }
      const body = await readFile(file);
      const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=3600' : 'no-cache', ...SEC });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      res.writeHead(500, SEC); res.end('Server error');
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const port = Number(process.env.PORT) || 4173;
  createServer().listen(port, '127.0.0.1', () => console.log(`HYPERCUT running at http://localhost:${port}`));
}

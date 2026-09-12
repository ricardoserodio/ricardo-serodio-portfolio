import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

// Hash the exact inline content produced by Astro, never allow arbitrary inline scripts.
const scripts = new Set();
const styles = new Set();
async function scan(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) await scan(path);
    else if (item.name.endsWith('.html')) {
      const html = await readFile(path, 'utf8');
      for (const [tag, hashes] of [['script', scripts], ['style', styles]]) {
        const pattern = new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'gi');
        for (const match of html.matchAll(pattern)) {
          if (tag === 'script' && /\bsrc\s*=/i.test(match[1])) continue;
          if (match[2]) hashes.add(`'sha256-${createHash('sha256').update(match[2]).digest('base64')}'`);
        }
      }
    }
  }
}
await scan('dist');
const csp = `default-src 'self'; script-src 'self' ${[...scripts].join(' ')}; style-src 'self' ${[...styles].join(' ')}; img-src 'self' data:; font-src 'self'; media-src 'self'; connect-src 'none'; object-src 'none'; frame-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; upgrade-insecure-requests`;
if (csp.length > 1900) throw new Error('CSP exceeds safe Cloudflare header line size; externalize inline scripts/styles.');
let headers = '';
try { headers = await readFile('dist/_headers', 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
// Replace only the headers this script owns; preserve unrelated rules.
headers = headers.split('\n').filter(line => !/^\s+(Content-Security-Policy|Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options|Referrer-Policy|Permissions-Policy):/i.test(line)).join('\n');
headers += `\n/*\n  Content-Security-Policy: ${csp}\n  Strict-Transport-Security: max-age=86400\n  X-Frame-Options: DENY\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()\n`;
await writeFile('dist/_headers', headers);
console.log(`Security headers generated: ${scripts.size} script hashes, ${styles.size} style hashes.`);

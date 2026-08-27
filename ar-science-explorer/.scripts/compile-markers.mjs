import { chromium } from 'playwright';
import { readdirSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

const MARKERS_DIR = path.resolve('public/markers');
const MIND_DIR = path.resolve('public/markers/mind');
const COMPILE_URL = 'https://hiukim.github.io/mind-ar-js-doc/tools/compile';

if (!existsSync(MIND_DIR)) mkdirSync(MIND_DIR, { recursive: true });

const jpgs = readdirSync(MARKERS_DIR).filter(f => /\.jpe?g$/i.test(f));
const pending = jpgs.filter(f => {
  const base = f.replace(/\.jpe?g$/i, '');
  return !existsSync(path.join(MIND_DIR, base + '.mind'));
});

console.log(`Found ${jpgs.length} markers, ${pending.length} still need compiling:`);
console.log(pending.join(', '));

if (pending.length === 0) {
  console.log('Nothing to do.');
  process.exit(0);
}

const browser = await chromium.launch({ headless: true });
const results = { ok: [], failed: [] };

for (const jpg of pending) {
  const base = jpg.replace(/\.jpe?g$/i, '');
  const outPath = path.join(MIND_DIR, base + '.mind');
  console.log(`\n[${base}] compiling ${jpg}...`);

  const page = await browser.newPage();
  try {
    await page.goto(COMPILE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.locator('input[type=file]').setInputFiles(path.join(MARKERS_DIR, jpg));
    await page.locator('.startButton_OY2G').click();

    // Wait for the same button to relabel itself "Download compiled"
    const downloadBtn = page.locator('.startButton_OY2G', { hasText: 'Download compiled' });
    await downloadBtn.waitFor({ state: 'visible', timeout: 60000 });

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      downloadBtn.click(),
    ]);
    await download.saveAs(outPath);

    console.log(`[${base}] OK -> ${outPath}`);
    results.ok.push(base);
  } catch (err) {
    console.error(`[${base}] FAILED:`, err.message);
    results.failed.push(base);
  } finally {
    await page.close();
  }
}

await browser.close();

console.log('\n=== SUMMARY ===');
console.log(`Compiled: ${results.ok.length} (${results.ok.join(', ')})`);
console.log(`Failed:   ${results.failed.length}${results.failed.length ? ' (' + results.failed.join(', ') + ')' : ''}`);

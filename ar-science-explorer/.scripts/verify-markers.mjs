import { chromium } from 'playwright';
import { readdirSync } from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5175';
const FAKE_CAM_DIR = path.resolve('.scripts/fake-cam');

// Same Q->glb mapping as src/lib/arConfig.ts
const GLB_MAP = {
  Q1W1: 'democritus_atom.glb', Q1W2: 'waterpolarity.glb', Q1W3: 'solid_liquid_gas.glb',
  Q1W4: 'particle_motion_temperature.glb', Q1W6: 'beakers.glb', Q1W7: 'saturated_unsaturated.glb',
  Q1W8: 'salt_dissolving_in_water.glb', Q2W1: 'Microscope.glb', Q2W2: 'plant_cell.glb',
  Q2W3: 'prokaryoticCell.glb', Q2W4: 'mitosis_phases.glb', Q2W5: 'Fertilization_Model_Light.glb',
  Q2W6: 'amoeba_binary_fission.glb', Q2W7: 'biological_organization.glb', Q2W8: 'food_web.glb',
  Q3W1: 'spring.glb', Q3W2: 'inclined_plane_slide_playground.glb', Q3W3: 'seesaw.glb',
  Q3W4: 'compass.glb', Q3W5: 'car.glb', Q3W6: 'jeepney.glb', Q3W7: 'thermometer.glb', Q3W8: 'spoon.glb',
};

const markers = readdirSync(FAKE_CAM_DIR).filter(f => f.endsWith('.y4m')).map(f => f.replace('.y4m', ''));
console.log(`Verifying ${markers.length} markers...\n`);

const results = { pass: [], fail: [] };

for (const marker of markers) {
  const glb = GLB_MAP[marker];
  const videoPath = path.join(FAKE_CAM_DIR, marker + '.y4m');
  const url = `${BASE_URL}/ar-viewer?${new URLSearchParams({
    mind: `/markers/mind/${marker}.mind`,
    glb: `/glb/${glb}`,
    title: marker,
    desc: 'verification run',
  })}`;

  const browser = await chromium.launch({
    args: [
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-video-capture=${videoPath}`,
      '--use-fake-ui-for-media-stream', // auto-grant camera permission
    ],
  });
  const context = await browser.newContext({ permissions: ['camera'] });
  const page = await context.newPage();

  await page.addInitScript(() => {
    window.__arEvents = [];
    window.addEventListener('message', (e) => window.__arEvents.push(e.data));
  });

  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  let found = false;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    // Poll for the ar-marker-found postMessage, up to 20s (video loops so
    // MindAR gets repeated chances to lock on across the 3s clip).
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(1000);
      const events = await page.evaluate(() => window.__arEvents);
      if (events.some(e => e && e.type === 'ar-marker-found')) { found = true; break; }
    }
  } catch (err) {
    consoleErrors.push('goto/eval error: ' + err.message);
  }

  console.log(`[${marker}] ${found ? 'DETECTED' : 'NOT DETECTED'}${consoleErrors.length ? '  (console errors: ' + consoleErrors.slice(0,2).join(' | ') + ')' : ''}`);
  (found ? results.pass : results.fail).push(marker);

  await browser.close();
}

console.log('\n=== SUMMARY ===');
console.log(`Detected:     ${results.pass.length}/${markers.length}`);
console.log(`Not detected: ${results.fail.length}${results.fail.length ? ' -> ' + results.fail.join(', ') : ''}`);

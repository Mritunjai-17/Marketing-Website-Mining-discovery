const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const baseDir = path.resolve('public/images/services');
const backupDir = path.resolve(baseDir, 'backup_before_real_photos');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Map of source candidates to services
const servicesToUpdate = [
  {
    num: '01',
    name: 'investor',
    src: path.resolve('.svc_candidates/test_out_01_handshake.webp'),
    files: ['service_01_investor_light.webp', 'service_01_investor_light_shifted.webp']
  },
  {
    num: '02',
    name: 'media',
    src: path.resolve('.svc_candidates/test_out_02_conf.webp'),
    files: ['service_02_media_light.webp', 'service_02_media_light_shifted.webp']
  },
  {
    num: '03',
    name: 'brand',
    src: path.resolve('.svc_candidates/test_out_03_drone.webp'),
    files: ['service_03_brand_light.webp', 'service_03_brand_light_shifted.webp']
  },
  {
    num: '04',
    name: 'reach',
    src: path.resolve('.svc_candidates/test_out_04_analytics.webp'),
    files: ['service_04_reach_light.webp', 'service_04_reach_light_shifted.webp']
  }
];

async function applyImages() {
  console.log('--- Applying Real World Images ---');
  for (const s of servicesToUpdate) {
    for (const f of s.files) {
      const dest = path.resolve(baseDir, f);
      // Backup original if exists and not already backed up
      const bkp = path.resolve(backupDir, f);
      if (fs.existsSync(dest) && !fs.existsSync(bkp)) {
        fs.copyFileSync(dest, bkp);
      }
      // Overwrite with real photo webp
      fs.copyFileSync(s.src, dest);
      console.log(`[OK] Updated ${f} (${fs.statSync(dest).size} bytes)`);
    }
  }

  // Also sync to D:\Marketing-Website-Mining-discovery\public\images\services
  const secondRepoDir = path.resolve('D:/Marketing-Website-Mining-discovery/public/images/services');
  if (fs.existsSync(secondRepoDir)) {
    console.log('--- Syncing to Mining-discovery repo ---');
    for (const s of servicesToUpdate) {
      for (const f of s.files) {
        const dest = path.resolve(secondRepoDir, f);
        fs.copyFileSync(s.src, dest);
        console.log(`[OK] Synced to Mining-discovery: ${f}`);
      }
    }
    // Also ensure service 05 is synced
    const s05Src = path.resolve(baseDir, 'service_05_intelligence_light.webp');
    if (fs.existsSync(s05Src)) {
      fs.copyFileSync(s05Src, path.resolve(secondRepoDir, 'service_05_intelligence_light.webp'));
      fs.copyFileSync(s05Src, path.resolve(secondRepoDir, 'service_05_intelligence_light_shifted.webp'));
      console.log('[OK] Synced service_05 to Mining-discovery');
    }
  }

  // Also sync to export-services-section\public\images\services
  const exportDir = path.resolve('export-services-section/public/images/services');
  if (fs.existsSync(exportDir)) {
    console.log('--- Syncing to export-services-section ---');
    for (const s of servicesToUpdate) {
      for (const f of s.files) {
        const dest = path.resolve(exportDir, f);
        fs.copyFileSync(s.src, dest);
        console.log(`[OK] Synced to export: ${f}`);
      }
    }
    const s05Src = path.resolve(baseDir, 'service_05_intelligence_light.webp');
    if (fs.existsSync(s05Src)) {
      fs.copyFileSync(s05Src, path.resolve(exportDir, 'service_05_intelligence_light.webp'));
      fs.copyFileSync(s05Src, path.resolve(exportDir, 'service_05_intelligence_light_shifted.webp'));
      console.log('[OK] Synced service_05 to export');
    }
  }

  console.log('--- All images safely deployed! ---');
}

applyImages().catch(console.error);

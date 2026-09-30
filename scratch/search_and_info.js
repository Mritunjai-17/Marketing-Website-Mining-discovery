const fs = require('fs');

async function searchBitmaps(q) {
  const searchUrl = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' + encodeURIComponent('filetype:bitmap ' + q) + '&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|size|mime&format=json';
  const res = await fetch(searchUrl, { headers: { 'User-Agent': 'MiningDiscoveryApp/1.0 (dev@marketingdiscovery.com)' } });
  const data = await res.json();
  const pages = data.query?.pages || {};
  console.log('=== ' + q + ' ===');
  for (const k of Object.keys(pages)) {
    const p = pages[k];
    const info = p.imageinfo?.[0];
    if (info && info.width >= 1600 && (info.mime === 'image/jpeg' || info.mime === 'image/png')) {
      console.log(p.title, `${info.width}x${info.height}`, info.url);
    }
  }
}

async function run() {
  await searchBitmaps('MacBook desk office plant');
  await searchBitmaps('creative agency meeting team');
  await searchBitmaps('office collaboration whiteboard');
}
run();

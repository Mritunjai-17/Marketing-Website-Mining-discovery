const fs = require('fs');

async function searchTitles(q) {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' + encodeURIComponent(q) + '&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url|size|mime&format=json';
  const res = await fetch(url, { headers: { 'User-Agent': 'MiningDiscoveryApp/1.0 (dev@marketingdiscovery.com)' } });
  const data = await res.json();
  const pages = data.query?.pages || {};
  console.log('=== SEARCH: ' + q + ' ===');
  for (const k of Object.keys(pages)) {
    const p = pages[k];
    const info = p.imageinfo?.[0];
    if (info && info.width >= 1600 && info.mime === 'image/jpeg') {
      console.log(p.title, info.width + 'x' + info.height, info.url);
    }
  }
}

async function run() {
  await searchTitles('intitle:"designer" "desk"');
  await searchTitles('intitle:"design" "agency"');
  await searchTitles('intitle:"branding" "office"');
  await searchTitles('intitle:"web design"');
  await searchTitles('intitle:"handshake" "meeting"');
  await searchTitles('intitle:"contract" "signing"');
  await searchTitles('intitle:"boardroom" "meeting"');
}
run();

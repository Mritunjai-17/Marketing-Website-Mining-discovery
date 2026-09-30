const fs = require('fs');

async function search(q) {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' + encodeURIComponent(q) + '&gsrnamespace=6&gsrlimit=15&prop=imageinfo&iiprop=url|size|mime&format=json';
  const res = await fetch(url, { headers: { 'User-Agent': 'MiningDiscoveryApp/1.0 (dev@marketingdiscovery.com)' } });
  const data = await res.json();
  const pages = data.query?.pages || {};
  console.log('=== ' + q + ' ===');
  for (const k of Object.keys(pages)) {
    const p = pages[k];
    const info = p.imageinfo?.[0];
    if (info && info.width >= 1600 && info.mime === 'image/jpeg') {
      console.log(p.title, info.width + 'x' + info.height, info.url);
    }
  }
}

async function run() {
  await search('"wireframe" desk OR screen');
  await search('"responsive design" laptop');
  await search('"creative agency" office');
  await search('"web agency" office');
  await search('"business meeting" boardroom');
  await search('"investor" boardroom');
  await search('"deal" handshake boardroom');
}
run();

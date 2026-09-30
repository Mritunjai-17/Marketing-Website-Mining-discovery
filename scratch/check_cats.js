const fs = require('fs');

async function checkCat(cat) {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=categorymembers&gcmtitle=' + encodeURIComponent('Category:' + cat) + '&gcmtype=file&gcmlimit=30&prop=imageinfo&iiprop=url|size|mime&format=json';
  const res = await fetch(url, { headers: { 'User-Agent': 'MiningDiscoveryApp/1.0 (dev@marketingdiscovery.com)' } });
  const data = await res.json();
  const pages = data.query?.pages || {};
  console.log('=== ' + cat + ' ===');
  for (const k of Object.keys(pages)) {
    const p = pages[k];
    const info = p.imageinfo?.[0];
    if (info && info.width >= 1600 && (info.mime === 'image/jpeg' || info.mime === 'image/png')) {
      console.log(p.title, info.width + 'x' + info.height, info.url);
    }
  }
}

async function run() {
  await checkCat('Computer workstations');
  await checkCat('Desks with computers');
  await checkCat('Boardrooms');
  await checkCat('Corporate presentations');
}
run();

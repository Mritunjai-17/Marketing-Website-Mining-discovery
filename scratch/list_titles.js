const fs = require('fs');

async function search(q) {
  const searchUrl = 'https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=' + encodeURIComponent(q) + '&srnamespace=6&srlimit=25&format=json';
  const res = await fetch(searchUrl, { headers: { 'User-Agent': 'MiningDiscoveryApp/1.0 (dev@marketingdiscovery.com)' } });
  const data = await res.json();
  const hits = data.query?.search || [];
  console.log('=== ' + q + ' (' + hits.length + ' results) ===');
  for (const h of hits) {
    console.log(h.title);
  }
}

async function run() {
  await search('web designer desk');
  await search('graphic designer computer');
  await search('wireframes laptop');
  await search('investor boardroom meeting');
}
run();

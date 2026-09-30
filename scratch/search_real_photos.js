const fs = require('fs');

async function search(q) {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=' + encodeURIComponent(q) + '&srnamespace=6&srlimit=8&format=json';
  const res = await fetch(url, { headers: { 'User-Agent': 'MiningDiscoveryApp/1.0 (dev@marketingdiscovery.com)' } });
  const data = await res.json();
  console.log('=== ' + q + ' ===');
  const titles = data.query?.search?.map(s => s.title) || [];
  console.log(titles);
  return titles;
}

async function checkCategory(cat) {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=' + encodeURIComponent('Category:' + cat) + '&cmtype=file&cmlimit=10&format=json';
  const res = await fetch(url, { headers: { 'User-Agent': 'MiningDiscoveryApp/1.0 (dev@marketingdiscovery.com)' } });
  const data = await res.json();
  console.log('=== Category:' + cat + ' ===');
  const titles = data.query?.categorymembers?.map(s => s.title) || [];
  console.log(titles);
  return titles;
}

async function run() {
  await search('Flickr "branding" computer OR laptop');
  await search('Flickr "graphic design" studio');
  await search('Flickr "web design" computer');
  await search('Flickr "analytics" screen OR laptop');
  await search('Flickr "meeting" handshake business');
  await search('Flickr "boardroom" meeting executives');
}

run();

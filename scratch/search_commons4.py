import httpx

url = 'https://commons.wikimedia.org/w/api.php'
params = {
    'action': 'query',
    'generator': 'search',
    'gsrsearch': 'filetype:bitmap "PDAC" OR "Mining Indaba" OR ("mining" AND "investor")',
    'gsrnamespace': 6,
    'gsrlimit': 25,
    'prop': 'imageinfo',
    'iiprop': 'url|size|mime',
    'format': 'json'
}
headers = {'User-Agent': 'MiningMarketingApp/1.0 (info@miningdiscovery.com)'}
r = httpx.get(url, params=params, headers=headers)
data = r.json()
pages = data.get('query', {}).get('pages', {})
for pid, page in pages.items():
    title = page.get('title')
    info = page.get('imageinfo', [{}])[0]
    mime = info.get('mime', '')
    if 'image/jpeg' in mime:
        print(f"{title} ({info.get('width')}x{info.get('height')}): {info.get('url')}")

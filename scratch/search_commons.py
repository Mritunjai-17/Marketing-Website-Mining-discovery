import httpx

url = 'https://commons.wikimedia.org/w/api.php'
params = {
    'action': 'query',
    'generator': 'search',
    'gsrsearch': 'mining convention conference presentation',
    'gsrnamespace': 6,
    'gsrlimit': 20,
    'prop': 'imageinfo',
    'iiprop': 'url|size|mime',
    'format': 'json'
}
headers = {'User-Agent': 'MiningMarketingApp/1.0 (info@miningdiscovery.com)'}
r = httpx.get(url, params=params, headers=headers)
data = r.json()
pages = data.get('query', {}).get('pages', {})
print(f'Found {len(pages)} files:')
for pid, page in pages.items():
    title = page.get('title')
    info = page.get('imageinfo', [{}])[0]
    img_url = info.get('url')
    w, h = info.get('width', 0), info.get('height', 0)
    mime = info.get('mime', '')
    if 'image/jpeg' in mime or 'image/png' in mime:
        print(f'{title} ({w}x{h}): {img_url}')

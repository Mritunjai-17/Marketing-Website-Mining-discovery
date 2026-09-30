import httpx
import json

url = 'https://commons.wikimedia.org/w/api.php'
params = {
    'action': 'query',
    'generator': 'search',
    'gsrsearch': 'mining conference presentation',
    'gsrnamespace': 6,
    'gsrlimit': 10,
    'prop': 'imageinfo',
    'iiprop': 'url|size|mime',
    'format': 'json'
}
headers = {'User-Agent': 'MiningMarketingApp/1.0 (info@miningdiscovery.com)'}
r = httpx.get(url, params=params, headers=headers)
data = r.json()
pages = data.get('query', {}).get('pages', {})
for pid, page in pages.items():
    print(page.get('title'), page.get('imageinfo'))

import httpx
import re

headers = {'User-Agent': 'Mozilla/5.0'}
url = 'https://www.juniorminingnetwork.com/junior-miner-news/press-releases/971-tsx-venture/grid/158652-grid-metals-announces-agreement-with-boliden-on-thompson-east-project.html'
try:
    r = httpx.get(url, headers=headers, follow_redirects=True, timeout=10)
    print('Status:', r.status_code)
    imgs = re.findall(r'src=["\']([^"\']+\.(?:jpg|png|webp))["\']', r.text)
    for img in imgs:
        print('Img:', img)
except Exception as e:
    print('Error:', e)

import httpx
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
try:
    r = httpx.get('https://gridmetalscorp.com/properties/thompson-east-project/', headers=headers, follow_redirects=True, timeout=10)
    print('Status:', r.status_code)
    imgs = re.findall(r'src=["\']([^"\']+\.(?:jpg|png|webp))["\']', r.text)
    for img in imgs:
        print('Img:', img)
except Exception as e:
    print('Error:', e)

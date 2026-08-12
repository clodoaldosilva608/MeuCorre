from pathlib import Path
from urllib.parse import unquote
import html
import json
import re
import requests
from bs4 import BeautifulSoup

HTML_PATH = Path('/home/ubuntu/browser_html/manus_im_bFmdFxz5y6it3tGjrXCA8W_1786502395095.html')
OUT = Path('/home/ubuntu/meu-corre-kit')
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'real_people').mkdir(exist_ok=True)
(OUT / 'mascotes').mkdir(exist_ok=True)
(OUT / 'vendas').mkdir(exist_ok=True)
(OUT / 'identidade').mkdir(exist_ok=True)

soup = BeautifulSoup(HTML_PATH.read_text(encoding='utf-8', errors='ignore'), 'html.parser')
records = []
seen = set()
for img in soup.find_all('img'):
    src = img.get('src') or img.get('data-src') or img.get('srcset')
    if not src or 'manuscdn.com' not in src:
        continue
    src = html.unescape(src)
    alt = (img.get('alt') or '').strip()
    if not alt:
        m = re.search(r'/([^/?]+?)(?:\.png|\.jpg|\.jpeg|\.webp)', src)
        alt = m.group(1) + '.png' if m else 'asset.png'
    if alt in seen:
        continue
    seen.add(alt)
    records.append({'filename': alt, 'url': src})

manifest = {'source_html': str(HTML_PATH), 'count': len(records), 'assets': records}
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')

for rec in records:
    name = rec['filename']
    if name.startswith('real_mascote_'):
        folder = OUT / 'real_people'
    elif name.startswith('mascote_'):
        folder = OUT / 'mascotes'
    elif name.startswith('vendas_'):
        folder = OUT / 'vendas'
    else:
        folder = OUT / 'identidade'
    dest = folder / name
    try:
        r = requests.get(rec['url'], timeout=30)
        r.raise_for_status()
        dest.write_bytes(r.content)
        rec['status'] = 'downloaded'
        rec['bytes'] = len(r.content)
        rec['local_path'] = str(dest)
    except Exception as exc:
        rec['status'] = 'error'
        rec['error'] = str(exc)

(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'count': len(records), 'downloaded': sum(r.get('status') == 'downloaded' for r in records), 'errors': [r for r in records if r.get('status') == 'error']}, ensure_ascii=False, indent=2))

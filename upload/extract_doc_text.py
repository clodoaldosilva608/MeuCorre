from pathlib import Path
import re
from bs4 import BeautifulSoup

path = Path(__import__('sys').argv[1])
out = Path(__import__('sys').argv[2])
soup = BeautifulSoup(path.read_text(encoding='utf-8', errors='ignore'), 'html.parser')
for tag in soup(['script','style','noscript','svg']):
    tag.decompose()
text = soup.get_text('\n')
lines = []
for line in text.splitlines():
    line = re.sub(r'\s+', ' ', line).strip()
    if line and (not lines or line != lines[-1]):
        lines.append(line)
out.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(f'{len(lines)} linhas salvas em {out}')

from pathlib import Path
import re

path = Path('/home/ubuntu/Plano_Divulgacao_MeuCorre_90_Dias.md')
text = path.read_text(encoding='utf-8')
blocks = re.findall(r'#### Postagem \d+.*?(?=\n#### Postagem|\n### Dia |\n# Referências)', text, flags=re.S)
required = ['**Título:**', '**Descrição:**', '**Hashtags:**', '**Texto de engajamento:**', '**Material existente a utilizar:**']
platforms = ['Instagram', 'TikTok', 'Facebook', 'YouTube']
missing = []
for idx, block in enumerate(blocks, start=1):
    absent = [field for field in required if field not in block]
    if absent:
        missing.append((idx, absent))
counts = {platform: len(re.findall(rf'\| {platform} \|', text)) for platform in platforms}
print(f'postagens={len(blocks)}')
print(f'dias={len(re.findall(r"^### Dia ", text, flags=re.M))}')
print('campos_ausentes=' + str(missing))
print('plataformas=' + str(counts))
if len(blocks) != 450 or missing or any(v < 90 for v in counts.values()):
    raise SystemExit(1)

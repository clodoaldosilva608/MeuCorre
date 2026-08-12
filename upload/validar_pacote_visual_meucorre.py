from pathlib import Path
import re

root = Path('/home/ubuntu/Pacote_Visual_MeuCorre_90_Dias')
plan = root / 'PLANO_DIVULGACAO_90_DIAS_COM_IMAGENS.md'
mapa = root / 'MAPA_VISUAL_450_POSTAGENS.md'
images = root / 'imagens_por_postagem'

plan_text = plan.read_text(encoding='utf-8')
map_text = mapa.read_text(encoding='utf-8')
links = re.findall(r'\*\*Imagem a compartilhar junto com esta descrição:\*\* \[`([^`]+)`\]', plan_text)
map_rows = re.findall(r'^\| M\d\d-D\d\d-P\d\d \|', map_text, flags=re.M)
files = sorted(images.rglob('*.png'))
missing = [link for link in links if not (root / link).exists()]
empty = [str(p.relative_to(root)) for p in files if p.stat().st_size == 0]
print(f'links_no_plano={len(links)}')
print(f'linhas_no_mapa={len(map_rows)}')
print(f'imagens_no_pacote={len(files)}')
print(f'links_faltantes={len(missing)}')
print(f'imagens_vazias={len(empty)}')
if len(links) != 450 or len(map_rows) != 450 or len(files) != 450 or missing or empty:
    raise SystemExit(1)

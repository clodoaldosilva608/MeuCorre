from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont

root = Path('/home/ubuntu/meu-corre-kit')
out = root / 'contact_sheet.png'
items = []
for folder in ['real_people_corretos', 'mascotes', 'vendas', 'identidade']:
    for p in sorted((root / folder).glob('*.png')):
        items.append((folder, p))
thumb_w, thumb_h = 260, 210
cols = 4
rows = (len(items) + cols - 1) // cols
sheet = Image.new('RGB', (cols * thumb_w, rows * thumb_h), '#111827')
draw = ImageDraw.Draw(sheet)
for i, (folder, path) in enumerate(items):
    try:
        im = Image.open(path).convert('RGB')
        im.thumbnail((thumb_w - 20, thumb_h - 50))
        x = (i % cols) * thumb_w + (thumb_w - im.width) // 2
        y = (i // cols) * thumb_h + 8
        sheet.paste(im, (x, y))
        label = f'{folder}/{path.name}'
        draw.text(((i % cols) * thumb_w + 8, (i // cols) * thumb_h + thumb_h - 32), label[:36], fill='white')
    except Exception as exc:
        draw.text(((i % cols) * thumb_w + 8, (i // cols) * thumb_h + 8), f'ERRO {path.name}: {exc}', fill='red')
sheet.save(out, 'PNG', optimize=True)
print(f'{len(items)} imagens em {out}')

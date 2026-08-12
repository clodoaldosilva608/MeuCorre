from pathlib import Path
import os
import re
import shutil
from collections import Counter

PLAN = Path('/home/ubuntu/Plano_Divulgacao_MeuCorre_90_Dias.md')
KIT = Path('/home/ubuntu/MeuCorre_Kit_Comercial_Consolidado')
REPO = Path('/home/ubuntu/MeuCorre_repo')
OUT = Path('/home/ubuntu/Pacote_Visual_MeuCorre_90_Dias')
IMAGES = OUT / 'imagens_por_postagem'


def resolve(ref: str) -> Path:
    if ref.startswith('Kit Comercial/'):
        return KIT / ref.removeprefix('Kit Comercial/')
    if ref.startswith('Repositório/'):
        return REPO / ref.removeprefix('Repositório/')
    raise ValueError(f'Referência sem raiz reconhecida: {ref}')


def safe_name(value: str) -> str:
    value = value.replace(' ', '_')
    value = re.sub(r'[^A-Za-z0-9_\-]', '', value)
    return value

text = PLAN.read_text(encoding='utf-8')
day_pattern = re.compile(
    r'### Dia (?P<day>\d+) \(Mês (?P<month>\d+), Dia \d+\)(?P<content>.*?)(?=\n### Dia |\n# Referências)',
    flags=re.S,
)
post_pattern = re.compile(
    r'#### Postagem (?P<post>\d+) — (?P<time>\d\d:\d\d) \| (?P<platform>[^|]+) \|.*?'
    r'\*\*Material existente a utilizar:\*\* `(?P<asset>[^`]+)`',
    flags=re.S,
)
records = []
for day_match in day_pattern.finditer(text):
    month = int(day_match.group('month'))
    day = int(day_match.group('day'))
    for match in post_pattern.finditer(day_match.group('content')):
        data = match.groupdict()
        source = resolve(data['asset'])
        if not source.exists():
            raise FileNotFoundError(source)
        post = int(data['post'])
        platform = safe_name(data['platform'].strip())
        filename = f'M{month:02d}_D{day:02d}_P{post:02d}_{platform}_{source.name}'
        relative = Path('imagens_por_postagem') / f'Mes_{month:02d}' / f'Dia_{day:02d}' / filename
        records.append({
            'index': len(records) + 1,
            'month': month,
            'day': day,
            'post': post,
            'time': data['time'],
            'platform': data['platform'].strip(),
            'source_ref': data['asset'],
            'source': source,
            'relative': relative,
        })

if len(records) != 450:
    raise RuntimeError(f'Esperadas 450 postagens, encontradas {len(records)}')

if OUT.exists():
    shutil.rmtree(OUT)
IMAGES.mkdir(parents=True)

for record in records:
    destination = OUT / record['relative']
    destination.parent.mkdir(parents=True, exist_ok=True)
    os.link(record['source'], destination)

# Atualiza o plano completo para explicitar a imagem junto à descrição.
assets = iter(records)
def replace_asset(match):
    record = next(assets)
    rel = record['relative'].as_posix()
    return (
        f'**Imagem a compartilhar junto com esta descrição:** [`{rel}`]({rel})\n\n'
        f'**Arquivo-base aprovado:** `{record["source_ref"]}`'
    )

updated_plan, substitutions = re.subn(
    r'\*\*Material existente a utilizar:\*\* `[^`]+`',
    replace_asset,
    text,
)
if substitutions != 450:
    raise RuntimeError(f'Substituições no plano: {substitutions}')
(OUT / 'PLANO_DIVULGACAO_90_DIAS_COM_IMAGENS.md').write_text(updated_plan, encoding='utf-8')

# Mapa rápido, com uma linha por postagem e caminho explícito da imagem.
lines = [
    '# Mapa Visual de Postagens — MeuCorre',
    '',
    'Este mapa vincula cada uma das **450 descrições** do plano editorial à imagem que deve ser publicada junto com ela. Cada caminho aponta para um arquivo PNG individual dentro deste pacote. As imagens foram organizadas por mês, dia e número de postagem para facilitar a publicação sequencial.',
    '',
    '> Os 450 arquivos de postagem foram criados a partir dos 28 ativos visuais aprovados já existentes. Quando uma imagem se repete no calendário, ela foi preservada como arquivo individual com o nome do post correspondente, evitando ambiguidade no momento de compartilhar.',
    '',
    '| Código | Dia | Horário | Plataforma | Imagem a compartilhar | Arquivo-base aprovado |',
    '| --- | ---: | --- | --- | --- | --- |',
]
for r in records:
    code = f'M{r["month"]:02d}-D{r["day"]:02d}-P{r["post"]:02d}'
    rel = r['relative'].as_posix()
    lines.append(
        f'| {code} | {r["day"]} | {r["time"]} | {r["platform"]} | '
        f'[`{rel}`]({rel}) | `{r["source_ref"]}` |'
    )
lines.extend([
    '',
    '## Resumo do acervo',
    '',
    f'O pacote contém **{len(records)} imagens prontas para compartilhamento**. Elas representam **{len(set(r["source_ref"] for r in records))} ativos visuais-base** já aprovados e disponibilizados no kit comercial e no repositório do MeuCorre.',
    '',
    'A relação completa entre legenda, título, hashtags, texto de engajamento e imagem está no arquivo `PLANO_DIVULGACAO_90_DIAS_COM_IMAGENS.md`.',
])
(OUT / 'MAPA_VISUAL_450_POSTAGENS.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')

# README do pacote.
usage = Counter(r['source_ref'] for r in records)
readme = [
    '# Pacote Visual do MeuCorre — 90 Dias',
    '',
    'Este pacote permite publicar o calendário de divulgação sem precisar procurar imagens manualmente. Para cada postagem, abra o arquivo Markdown do plano, localize o campo **Imagem a compartilhar junto com esta descrição** e use o arquivo PNG indicado no mesmo caminho.',
    '',
    '| Item | Quantidade |',
    '| --- | ---: |',
    '| Postagens do plano | 450 |',
    '| Imagens individuais organizadas por postagem | 450 |',
    f'| Ativos visuais-base reutilizados | {len(usage)} |',
    '',
    'Os arquivos são PNGs nomeados de forma sequencial: `Mês`, `Dia`, `Postagem`, `Plataforma` e nome do ativo-base. Exemplo: `M01_D01_P01_Instagram_vendas_ig_feed_1.png` é a primeira imagem a compartilhar no primeiro post do primeiro dia.',
    '',
    '## Arquivos principais',
    '',
    '| Arquivo | Finalidade |',
    '| --- | --- |',
    '| `PLANO_DIVULGACAO_90_DIAS_COM_IMAGENS.md` | Plano completo com cada legenda e a imagem explícita correspondente |',
    '| `MAPA_VISUAL_450_POSTAGENS.md` | Lista rápida de todas as 450 imagens por código, dia e plataforma |',
    '| `imagens_por_postagem/` | Diretório com as imagens prontas para anexar a cada publicação |',
    '',
    '> Antes de publicar ofertas, preços, campanhas de indicação ou links de checkout, confira se as condições comerciais continuam vigentes na landing page oficial do MeuCorre.',
]
(OUT / 'README.md').write_text('\n'.join(readme) + '\n', encoding='utf-8')

print(f'postagens={len(records)}')
print(f'imagens_individuais={sum(1 for _ in IMAGES.rglob("*.png"))}')
print(f'ativos_base={len(usage)}')
print(f'diretório={OUT}')

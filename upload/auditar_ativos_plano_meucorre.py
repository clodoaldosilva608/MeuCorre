from pathlib import Path
import re
import json
from collections import Counter

plan = Path('/home/ubuntu/Plano_Divulgacao_MeuCorre_90_Dias.md')
kit = Path('/home/ubuntu/MeuCorre_Kit_Comercial_Consolidado')
repo = Path('/home/ubuntu/MeuCorre_repo')
output = Path('/home/ubuntu/auditoria_ativos_plano_meucorre.json')

text = plan.read_text(encoding='utf-8')
refs = re.findall(r'\*\*Material existente a utilizar:\*\* `([^`]+)`', text)

def resolve(ref: str) -> Path:
    if ref.startswith('Kit Comercial/'):
        return kit / ref.removeprefix('Kit Comercial/')
    if ref.startswith('Repositório/'):
        return repo / ref.removeprefix('Repositório/')
    raise ValueError(f'Referência sem raiz reconhecida: {ref}')

entries = []
for ref in refs:
    resolved = resolve(ref)
    entries.append({'referencia': ref, 'origem': str(resolved), 'existe': resolved.exists()})

counts = Counter(x['referencia'] for x in entries)
missing = sorted({x['referencia'] for x in entries if not x['existe']})
report = {
    'postagens_referenciadas': len(entries),
    'ativos_unicos': len(counts),
    'referencias_faltantes': missing,
    'ativos': [
        {
            'referencia': ref,
            'origem': str(resolve(ref)),
            'quantidade_de_uso': count,
            'existe': resolve(ref).exists(),
        }
        for ref, count in sorted(counts.items())
    ],
}
output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'postagens_referenciadas={report["postagens_referenciadas"]}')
print(f'ativos_unicos={report["ativos_unicos"]}')
print(f'referencias_faltantes={len(missing)}')
for item in report['ativos']:
    print(f'{item["quantidade_de_uso"]:3d} | {item["existe"]!s:5s} | {item["referencia"]}')
if missing or len(entries) != 450:
    raise SystemExit(1)

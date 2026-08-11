#!/usr/bin/env python3
"""Analisa padrões de captação de leads em sites de referência."""
import json
import re
import sys

def analyze(filepath):
    with open(filepath) as f:
        data = json.load(f)
    html = data.get('data', {}).get('html') or data.get('html') or ''
    title = data.get('data', {}).get('title') or data.get('title') or ''

    print(f"\n{'='*60}")
    print(f"ANÁLISE: {filepath}")
    print(f"Title: {title}")
    print(f"HTML length: {len(html)} chars")
    print(f"{'='*60}")

    # Padrões de captação de leads
    patterns = [
        ('Formulários', r'<form[^>]*>', re.IGNORECASE),
        ('Input email', r'input[^>]*type=["\']email', re.IGNORECASE),
        ('Input text', r'input[^>]*type=["\']text', re.IGNORECASE),
        ('Botões CTA', r'<button[^>]*>', re.IGNORECASE),
        ('Links WhatsApp', r'wa\.me|whatsapp', re.IGNORECASE),
        ('Calendly', r'calendly', re.IGNORECASE),
        ('PIX', r'\bpix\b', re.IGNORECASE),
        ('Preço/Sinais', r'R\$|grátis|gratuito|vitalício|assinatura', re.IGNORECASE),
        ('Trial', r'trial|teste grátis|teste gratuito', re.IGNORECASE),
        ('Prova social', r'depoimento|caso de sucesso|resultado|\+\d+\s*(mil|usuários|clientes)', re.IGNORECASE),
        ('Indicação/Referral', r'indique|referral|afiliado|comissão|ganhe', re.IGNORECASE),
        ('Urgência/Escassez', r'última|vagas? limitadas|acaba em|hoje apenas|antes que', re.IGNORECASE),
        ('Popup/Modal', r'modal|popup|dialog|overlay', re.IGNORECASE),
        ('Exit intent', r'exit.?intent|beforeunload|mouseleave', re.IGNORECASE),
    ]

    print("\nPADRÕES DE CAPTAÇÃO:")
    for name, pattern, flags in patterns:
        matches = re.findall(pattern, html, flags)
        print(f"  {name}: {len(matches)}")

    # Extrair CTAs
    print("\nCTAs (botões):")
    buttons = re.findall(r'<button[^>]*>([^<]+)</button>', html, re.IGNORECASE)
    seen = set()
    for b in buttons[:15]:
        b_clean = re.sub(r'\s+', ' ', b).strip()
        if b_clean and b_clean not in seen:
            seen.add(b_clean)
            print(f"  - {b_clean[:80]}")

    # Extrair links importantes
    print("\nLinks importantes (não nav):")
    links = re.findall(r'<a[^>]*href=["\']([^"\']+)["\'][^>]*>([^<]+)</a>', html, re.IGNORECASE)
    seen_links = set()
    for href, text in links[:20]:
        text_clean = re.sub(r'\s+', ' ', text).strip()
        if (href, text_clean) not in seen_links and text_clean:
            seen_links.add((href, text_clean))
            print(f"  [{text_clean[:50]}] -> {href[:80]}")

    # Extrair headlines
    print("\nHeadlines (h1, h2, h3):")
    for tag in ['h1', 'h2', 'h3']:
        headlines = re.findall(rf'<{tag}[^>]*>([^<]+)</{tag}>', html, re.IGNORECASE)
        for h in headlines[:5]:
            h_clean = re.sub(r'\s+', ' ', h).strip()
            if h_clean:
                print(f"  [{tag}] {h_clean[:120]}")

    # Estratégias de conversão
    print("\nESTRATÉGIAS DE CONVERSÃO IDENTIFICADAS:")
    strategies = []
    if re.search(r'wa\.me|whatsapp', html, re.I):
        strategies.append("  ✓ Captura via WhatsApp (contato direto)")
    if re.search(r'calendly', html, re.I):
        strategies.append("  ✓ Agendamento via Calendly")
    if re.search(r'trial|teste grátis|teste gratuito', html, re.I):
        strategies.append("  ✓ Trial gratuito como isca")
    if re.search(r'indique|referral|afiliado|comissão', html, re.I):
        strategies.append("  ✓ Programa de indicação/comissão")
    if re.search(r'\+\d+\s*(mil|usuários|clientes|milhões)', html, re.I):
        strategies.append("  ✓ Prova social numérica")
    if re.search(r'última|vagas? limitadas|acaba em|hoje apenas', html, re.I):
        strategies.append("  ✓ Escassez/urgência")
    if re.search(r'R\$\s*\d+|grátis|gratuito', html, re.I):
        strategies.append("  ✓ Preço destacado")
    if re.search(r'depoimento|caso de sucesso|resultado', html, re.I):
        strategies.append("  ✓ Depoimentos/casos de sucesso")
    if not strategies:
        strategies.append("  (nenhuma estratégia óbvia detectada)")
    for s in strategies:
        print(s)

    # Resumo do funil
    print("\nRESUMO DO FUNIL:")
    text = re.sub(r'<[^>]+>', ' ', html)
    text = re.sub(r'\s+', ' ', text).strip()
    # Pegar primeiros 800 chars de texto visível
    visible = text[:1500]
    print(f"  {visible}")

if __name__ == '__main__':
    for fp in sys.argv[1:]:
        analyze(fp)

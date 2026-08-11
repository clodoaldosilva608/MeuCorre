#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cria 10 páginas de blog individuais a partir dos arquivos HTML."""

import os
import re

POSTS = [
    ("calcular-lucro-real-entregador", 1, "Como Calcular o Lucro Real Como Entregador de App"),
    ("planejamento-financeiro-motoboys", 2, "Planejamento Financeiro para Motoboys: Guia Completo 2026"),
    ("manutencao-moto-entregadores", 3, "Manutenção da Moto para Entregadores: Checklist Completo"),
    ("economizar-combustivel-entregador", 4, "Como Economizar Combustível Sendo Entregador"),
    ("melhores-horarios-zonas-entregar", 5, "Melhores Horários e Zonas para Entregar em Cada App"),
    ("equipamentos-essenciais-entregadores", 6, "Equipamentos Essenciais para Entregadores de App"),
    ("gestao-tempo-entregadores", 7, "Gestão de Tempo para Entregadores: Como Rodar Mais"),
    ("declaracao-imposto-renda-entregadores-2026", 8, "Declaração de Imposto de Renda para Entregadores 2026"),
    ("qual-app-entrega-da-mais-dinheiro-2026", 9, "Qual App de Entrega Dá Mais Dinheiro? Comparativo 2026"),
    ("entregador-5-estrelas-todos-apps", 10, "Como Se Tornar um Entregador 5 Estrelas em Todos os Apps"),
]

for slug, num, title in POSTS:
    post_file = f"/home/z/my-project/download/blog-posts/post-{num:02d}.html"
    if not os.path.exists(post_file):
        print(f"  ✗ post-{num:02d}.html não encontrado")
        continue

    with open(post_file, "r", encoding="utf-8") as f:
        html_content = f.read()

    # Extract body content
    body_match = re.search(r"<body>(.*?)</body>", html_content, re.DOTALL)
    body = body_match.group(1) if body_match else html_content

    # Fix image paths
    body = body.replace(f'capa-{num}.png', f'/blog-covers/capa-{num}.png')

    # Escape backticks and ${ in the body for JSX
    body_escaped = body.replace("`", "\\`").replace("${", "\\${")

    dir_path = f"/home/z/my-project/src/app/blog/{slug}"
    os.makedirs(dir_path, exist_ok=True)

    page_content = '''"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function BlogPostPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-zinc-900 dark:text-zinc-100">
      <Link href="/blog" className="text-xs font-bold text-emerald-600 hover:underline">
        ← Voltar para o blog
      </Link>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-4 blog-post-content"
      >
        <div dangerouslySetInnerHTML={{ __html: `''' + body_escaped + '''` }} />
      </motion.div>
    </div>
  );
}
'''

    with open(f"{dir_path}/page.tsx", "w", encoding="utf-8") as f:
        f.write(page_content)
    print(f"  ✓ /blog/{slug}/page.tsx")

print(f"\n=== {len(POSTS)} páginas de blog criadas ===")

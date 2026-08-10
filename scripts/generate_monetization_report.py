#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MeuCorre — Analise de Monetizacao e Plano de Implementacao (PDF)."""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.platypus.flowables import HRFlowable

OUTPUT = "/home/z/my-project/download/MeuCorre-Analise-Monetizacao.pdf"
FONT_DIR = "/usr/share/fonts"

pdfmetrics.registerFont(TTFont("NotoSerifSC", f"{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf"))
pdfmetrics.registerFont(TTFont("NotoSerifSC-Bold", f"{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf"))
registerFontFamily("NotoSerifSC", normal="NotoSerifSC", bold="NotoSerifSC-Bold")
pdfmetrics.registerFont(TTFont("NotoSansSC", f"{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf"))
pdfmetrics.registerFont(TTFont("NotoSansSC-Bold", f"{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf"))
registerFontFamily("NotoSansSC", normal="NotoSansSC", bold="NotoSansSC-Bold")

C_NEON = HexColor("#39FF14")
C_DARK = HexColor("#064E3B")
C_TEXT = HexColor("#1E293B")
C_MUTED = HexColor("#64748B")
C_BORDER = HexColor("#E2E8F0")

styles = getSampleStyleSheet()
style_h1 = ParagraphStyle("H1", fontName="NotoSerifSC-Bold", fontSize=18, leading=22, textColor=C_DARK, spaceBefore=18, spaceAfter=10, alignment=TA_LEFT)
style_h2 = ParagraphStyle("H2", fontName="NotoSerifSC-Bold", fontSize=14, leading=18, textColor=C_NEON, spaceBefore=14, spaceAfter=6, alignment=TA_LEFT)
style_h3 = ParagraphStyle("H3", fontName="NotoSerifSC-Bold", fontSize=11, leading=14, textColor=C_TEXT, spaceBefore=10, spaceAfter=4, alignment=TA_LEFT)
style_body = ParagraphStyle("Body", fontName="NotoSerifSC", fontSize=10, leading=15, textColor=C_TEXT, spaceAfter=6, alignment=TA_JUSTIFY)
style_caption = ParagraphStyle("Caption", fontName="NotoSansSC", fontSize=8, leading=11, textColor=C_MUTED, spaceAfter=4, alignment=TA_LEFT)
style_bullet = ParagraphStyle("Bullet", parent=style_body, leftIndent=14, bulletIndent=4, spaceAfter=3)
style_th = ParagraphStyle("TH", fontName="NotoSansSC-Bold", fontSize=9, leading=12, textColor=white, alignment=TA_LEFT)
style_td = ParagraphStyle("TD", fontName="NotoSansSC", fontSize=9, leading=12, textColor=C_TEXT, alignment=TA_LEFT)
style_td_c = ParagraphStyle("TDC", parent=style_td, alignment=TA_CENTER)


def build_cover():
    e = []
    e.append(Spacer(1, 50 * mm))
    tag = Table([[Paragraph('<font name="NotoSansSC-Bold" size="9" color="#39FF14">ANALISE ESTRATEGICA</font>', style_caption)]], colWidths=[70*mm])
    tag.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), HexColor("#ECFDF5")),
        ("BOX", (0,0), (-1,-1), 0.5, C_NEON),
        ("LEFTPADDING", (0,0), (-1,-1), 8), ("RIGHTPADDING", (0,0), (-1,-1), 8),
        ("TOPPADDING", (0,0), (-1,-1), 4), ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ]))
    e.append(tag)
    e.append(Spacer(1, 12 * mm))
    e.append(Paragraph('<font name="NotoSerifSC-Bold" size="34" color="#064E3B">Monetizacao</font>', ParagraphStyle("T", fontName="NotoSerifSC-Bold", fontSize=34, leading=40, alignment=TA_LEFT)))
    e.append(Paragraph('<font name="NotoSerifSC-Bold" size="22" color="#1E293B">Analise completa e<br/>plano de implementacao</font>', ParagraphStyle("S", fontName="NotoSerifSC-Bold", fontSize=22, leading=28, alignment=TA_LEFT, spaceBefore=4)))
    e.append(Spacer(1, 14 * mm))
    e.append(HRFlowable(width=80 * mm, thickness=2, color=C_NEON, spaceBefore=0, spaceAfter=14))
    e.append(Paragraph("Diagnostico do estado atual do MeuCorre (Fase 4 concluida), avaliacao das 6 frentes de monetizacao propostas, feedback critico sobre o mapa recebido, e roadmap de implementacao em 4 fases com priorizacao baseada em effort x impact.", ParagraphStyle("D", fontName="NotoSerifSC", fontSize=12, leading=18, textColor=C_MUTED, alignment=TA_LEFT)))
    e.append(Spacer(1, 30 * mm))

    summary = [
        [Paragraph('<font color="#64748B" size="8">PROJETO</font>', style_caption), Paragraph('<font color="#1E293B" size="10"><b>MeuCorre</b> — Gestao de Entregas</font>', style_td)],
        [Paragraph('<font color="#64748B" size="8">STATUS ATUAL</font>', style_caption), Paragraph('<font color="#16A34A" size="10">Fase 4 concluida — em producao desde 10/08/2026</font>', style_td)],
        [Paragraph('<font color="#64748B" size="8">FRENTES ANALISADAS</font>', style_caption), Paragraph('<font color="#1E293B" size="10">6 (assinatura, parcerias, dados, B2B, marketplace, premium)</font>', style_td)],
        [Paragraph('<font color="#64748B" size="8">FASES DE IMPL.</font>', style_caption), Paragraph('<font color="#1E293B" size="10">4 fases (90, 180, 365, 730 dias)</font>', style_td)],
        [Paragraph('<font color="#64748B" size="8">DATA</font>', style_caption), Paragraph('<font color="#1E293B" size="10">10 de agosto de 2026</font>', style_td)],
    ]
    t = Table(summary, colWidths=[38 * mm, 107 * mm])
    t.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING", (0,0), (-1,-1), 0), ("RIGHTPADDING", (0,0), (-1,-1), 6),
        ("TOPPADDING", (0,0), (-1,-1), 6), ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LINEBELOW", (0,0), (-1,-2), 0.3, C_BORDER),
    ]))
    e.append(t)
    e.append(PageBreak())
    return e


def section_diagnosis():
    e = []
    e.append(Paragraph("1. Diagnostico do Estado Atual", style_h1))
    e.append(Paragraph("Antes de discutir monetizacao, e fundamental entender o que o MeuCorre ja tem construido e operando em producao. Apos 4 fases de preparacao concluidas (estabilizacao, testes de aceitacao, performance, e go-live), o produto tem uma base solida que influencia diretamente quais frentes de monetizacao sao viaveis agora versus quais exigem volume de usuarios para fazer sentido.", style_body))

    e.append(Paragraph("1.1 O que ja esta pronto e operando", style_h2))
    e.append(Paragraph("O MeuCorre esta em producao desde 10 de agosto de 2026, deployavel via git push com CI/CD automatico no Vercel. A arquitetura e Local-First (Dexie.js/IndexedDB) com sync opcional para o Supabase quando o usuario faz login. Isso significa que o app funciona 100% offline por design, e o sync e um bonus para usuarios logados que querem backup entre dispositivos. Essa separacao e crucial para a estrategia de monetizacao: o plano gratuito ja entrega valor real (offline total), e o pago precisa adicionar valor por cima sem bloquear o uso basico.", style_body))

    data = [
        [Paragraph("<b>Componente</b>", style_th), Paragraph("<b>Estado</b>", style_th), Paragraph("<b>Impacto na monetizacao</b>", style_th)],
        [Paragraph("App do entregador (PWA)", style_td), Paragraph('<font color="#16A34A">Em producao</font>', style_td_c), Paragraph("Base instalavel, sem passar por lojas", style_td)],
        [Paragraph("Sistema de auth (cadastro/login)", style_td), Paragraph('<font color="#16A34A">Funcional</font>', style_td_c), Paragraph("Permite diferenciar plano free vs PRO", style_td)],
        [Paragraph("Pagamento vitalicio via Kiwify", style_td), Paragraph('<font color="#16A34A">Funcional</font>', style_td_c), Paragraph("Ja gera receita, mas sem recorrencia", style_td)],
        [Paragraph("Sistema de referral (R$5 PIX)", style_td), Paragraph('<font color="#16A34A">Funcional</font>', style_td_c), Paragraph("Canal de aquisicao organico ativo", style_td)],
        [Paragraph("Sync entre dispositivos", style_td), Paragraph('<font color="#16A34A">Funcional</font>', style_td_c), Paragraph("Base para backup premium pago", style_td)],
        [Paragraph("Painel admin (anuncios, usuarios)", style_td), Paragraph('<font color="#16A34A">Funcional</font>', style_td_c), Paragraph("Permite vender anuncios nativos", style_td)],
        [Paragraph("Sentry + Redis + observabilidade", style_td), Paragraph('<font color="#16A34A">Configurado</font>', style_td_c), Paragraph("Base para analytics e dados agregados", style_td)],
        [Paragraph("71 testes E2E automatizados", style_td), Paragraph('<font color="#16A34A">Verdes</font>', style_td_c), Paragraph("Permite iterar rapido sem quebrar", style_td)],
    ]
    t = Table(data, colWidths=[55*mm, 30*mm, 65*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), C_DARK), ("TEXTCOLOR", (0,0), (-1,0), white),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING", (0,0), (-1,-1), 5), ("RIGHTPADDING", (0,0), (-1,-1), 5),
        ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, HexColor("#F8FAFC")]),
        ("BOX", (0,0), (-1,-1), 0.3, C_BORDER),
    ]))
    e.append(t)

    e.append(Paragraph("1.2 O modelo atual de receita (e seus limites)", style_h2))
    e.append(Paragraph("Hoje o MeuCorre tem uma unica fonte de receita: a venda do plano vitalicio PRO por R$ 18,90 (preco de lancamento, depois R$ 97). Esse modelo tem 3 problemas estruturais que limitam o teto de receita. Primeiro, e uma venda unica sem recorrencia, ou seja, cada cliente gera receita apenas uma vez e o crescimento depende exclusivamente de novos cadastros. Segundo, o preco baixo (R$ 18,90) e otimo para conversao mas ruim para LTV — para faturar R$ 10.000/mes seriam necessarios ~530 novos clientes por mes, o que e agressivo. Terceiro, nao ha upsell nem cross-sell: quem ja pagou o vitalicio nao tem nada mais para comprar.", style_body))
    e.append(Paragraph("Por outro lado, o modelo vitalicio tem uma vantagem que nao deve ser desconsiderada: ele e um diferencial competitivo forte contra concorrentes que cobram mensalidade. Entregadores brasileiros sao resistentes a assinaturas recorrentes (muitos ja pagam iFood+99+Lalamove+combustivel+celular e veem mensalidade como mais um peso). O vitalicio comunica compromisso e baixa friccao. A estrategia recomendada nao e abandonar o vitalicio, mas sim adicionar camadas de receita por cima dele.", style_body))

    e.append(Paragraph("1.3 O publico-alvo como ativo", style_h2))
    e.append(Paragraph("O ativo mais valioso do MeuCorre nao e o codigo, e o ponto de contato diario com um publico cobicado: entregadores de aplicativo que usam o app todos os dias, durante jornadas de 8-12h, para lancar corridas e ver lucro. Esse publico e disputado por bancos (conta PJ, credito), seguradoras (seguro de moto, vida), postos de combustivel (cashback), operadoras de celular (planos de dados), e fabricantes de equipamentos (mochila, suporte, capa). Cada uma dessas empresas paga entre R$ 5 e R$ 50 por lead qualificado de entregador. Com 1.000 usuarios ativos diarios, o MeuCorre tem um ativo de midia que pode gerar R$ 5.000 a R$ 50.000/mes em parcerias, dependendo do modelo de cobranca.", style_body))

    return e


def section_evaluation():
    e = []
    e.append(Paragraph("2. Avaliacao das 6 Frentes de Monetizacao", style_h1))
    e.append(Paragraph("O mapa de monetizacao que voce montou e estruturalmente correto e cobre bem o espectro completo de possibilidades. Minha avaliacao abaixo adiciona criterios objetivos (effort, impacto, prazo, risco) para ajudar a priorizar. Cada frente recebe uma nota de 1 a 5 em 4 dimensoes, e um veredito final.", style_body))

    e.append(Paragraph("2.1 Matriz de avaliacao", style_h2))
    data = [
        [Paragraph("<b>Frente</b>", style_th), Paragraph("<b>Effort</b><br/>(1=facil, 5=complexo)", style_th), Paragraph("<b>Impacto</b><br/>(1=baixo, 5=alto)", style_th), Paragraph("<b>Prazo</b>", style_th), Paragraph("<b>Veredito</b>", style_th)],
        [Paragraph("1. Assinatura em camadas", style_td), Paragraph("3", style_td_c), Paragraph("4", style_td_c), Paragraph("30-60 dias", style_td_c), Paragraph('<font color="#16A34A"><b>Fazer primeiro</b></font>', style_td_c)],
        [Paragraph("2. Parcerias e afiliados", style_td), Paragraph("4", style_td_c), Paragraph("5", style_td_c), Paragraph("90-180 dias", style_td_c), Paragraph('<font color="#16A34A"><b>Foco principal</b></font>', style_td_c)],
        [Paragraph("3. Dados como produto", style_td), Paragraph("5", style_td_c), Paragraph("3", style_td_c), Paragraph("365+ dias", style_td_c), Paragraph('<font color="#D97706"><b>Depois de volume</b></font>', style_td_c)],
        [Paragraph("4. B2B / gestao de equipes", style_td), Paragraph("5", style_td_c), Paragraph("4", style_td_c), Paragraph("365+ dias", style_td_c), Paragraph('<font color="#D97706"><b>So com 5k+ usuarios</b></font>', style_td_c)],
        [Paragraph("5. Marketplace de produtos", style_td), Paragraph("3", style_td_c), Paragraph("2", style_td_c), Paragraph("180 dias", style_td_c), Paragraph('<font color="#DC2626"><b>Prioridade baixa</b></font>', style_td_c)],
        [Paragraph("6. Conveniencia premium", style_td), Paragraph("2", style_td_c), Paragraph("3", style_td_c), Paragraph("30-60 dias", style_td_c), Paragraph('<font color="#16A34A"><b>Fazer junto c/ assinatura</b></font>', style_td_c)],
    ]
    t = Table(data, colWidths=[42*mm, 22*mm, 22*mm, 25*mm, 40*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), C_DARK), ("TEXTCOLOR", (0,0), (-1,0), white),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING", (0,0), (-1,-1), 4), ("RIGHTPADDING", (0,0), (-1,-1), 4),
        ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, HexColor("#F8FAFC")]),
        ("BOX", (0,0), (-1,-1), 0.3, C_BORDER),
    ]))
    e.append(t)

    e.append(Paragraph("2.2 Detalhamento por frente", style_h2))

    e.append(Paragraph("Frente 1 — Assinatura em camadas: FAZER PRIMEIRO", style_h3))
    e.append(Paragraph("Sua proposta de dividir em Free (limitado) + Pro (R$9,90 a R$19,90/mes) e tecnicamente correta, mas precisa de um ajuste importante: o MeuCorre ja vende plano vitalicio por R$ 18,90. Nao da para simplesmente trocar por mensalidade sem irritar quem ja pagou ou sem parecer que voce mudou as regras do jogo. A saida e manter o vitalicio como produto premium maximo (sem mais disponibilidade para novos compradores apos um cutoff, ou manter mas reposicionar) e introduzir a mensalidade como tier intermediario. Quem ja e vitalicio mantem tudo; novos usuarios escolhem entre mensalidade ou compra unica.", style_body))
    e.append(Paragraph("A tabela Free vs Pro que voce desenhou e boa, mas recomendo ajustar a limitacao do free: 30 corridas/mes e muito generoso para o publico brasileiro (um entregador ativo faz 20-40 corridas/dia, entao 30/mes nao dura nem um dia de trabalho). O limite ideal e 5 lancamentos/dia (ja implementado) apos os 14 dias de trial. Isso da para o usuario sentir o valor (usa 5 dias seguidos) mas bate no limite rapido o suficiente para considerar pagar.", style_body))

    e.append(Paragraph("Frente 2 — Parcerias: O FOCO PRINCIPAL", style_h3))
    e.append(Paragraph("Esta e a frente com maior potencial de receita e voce acertou em priorizar combustivel, seguro e fintech. Adiciono uma observacao critica: comecar por combustivel e mais facil (conversao alta, postos querem trapego), mas fintech paga mais por usuario (R$ 30-80 por conta PJ aberta vs R$ 2-5 por abastecimento com cashback). A estrategia ideal e comecar com combustivel para validar o canal, usar os numeros de conversao como caso para abordar fintechs 6 meses depois.", style_body))
    e.append(Paragraph("O modelo de cobranca recomendado: CPA (custo por aquisicao) para parcerias de volume (combustivel, telecom), e revenue share para parcerias de alto ticket (fintech, seguro). Nao cobrar mensalidade fixa do parceiro no inicio — CPA baixa a barreira de entrada e prova valor antes de cobrar assinatura.", style_body))

    e.append(Paragraph("Frente 3 — Dados: SO DEPOIS DE VOLUME", style_h3))
    e.append(Paragraph("Seu instinto de deixar dados por ultimo e preservar a privacidade como diferencial esta correto. O MeuCorre nao tem volume de usuarios para monetizar dados agregados hoje (precisa de 5k+ usuarios ativos para que estatisticas sejam significativas). O comprovante de renda sob consentimento, por outro lado, e uma mina de ouro que pode ser lancada mais cedo (Fase 2) porque resolve dor real e nao exige volume — cada solicitacao individual ja tem valor. Recomendo cobrar R$ 9,90 por comprovante avulso ou incluir no Pro.", style_body))

    e.append(Paragraph("Frente 4 — B2B: SO COM 5K+ USUARIOS", style_h3))
    e.append(Paragraph("Gestao de equipes e white label sao otimos produtos mas exigem volume e reputacao que o MeuCorre ainda nao tem. Nenhum restaurante ou cooperativa vai adotar uma ferramenta B2B de uma startup com 100 usuarios. O caminho e deixar isso para Fase 4 (12-24 meses) quando houver casos de uso reais comprovados. A API, porem, pode ser lancada antes (Fase 3) como ferramenta de parceria — fintechs podem integrar diretamente para oferecer credito baseado em dados de renda (com consentimento).", style_body))

    e.append(Paragraph("Frente 5 — Marketplace: PRIORIDADE BAIXA", style_h3))
    e.append(Paragraph("Loja de produtos para entregador tem margem baixa (5-15% de afiliado) e exige curadoria continua. O esforco de manter catalogo, precos atualizados, e suporte nao compensa a receita esperada nos primeiros 12 meses. Melhor deixar para Fase 4 ou nunca fazer — o espaco no app e mais valioso vendendo anuncios nativos de parceiros (Frente 2) do que como loja propria.", style_body))

    e.append(Paragraph("Frente 6 — Conveniencia premium: FAZER JUNTO COM ASSINATURA", style_h3))
    e.append(Paragraph("Backup em nuvem ja esta implementado (sync Supabase) e e o argumento mais forte do Pro. Multi-dispositivo tambem ja funciona via sync. Suporte prioritario via WhatsApp e trivial de configurar (apenas expor o numero no app para usuarios Pro). Tudo isso pode ser empacotado no lancamento da assinatura sem esforco adicional significativo.", style_body))

    return e


def section_feedback():
    e = []
    e.append(Paragraph("3. Feedback Critico sobre o Mapa Proposto", style_h1))
    e.append(Paragraph("Seu mapa de monetizacao e estruturado de forma excelente e mostra visao estrategica madura. Os principios que voce definiu (privacidade como diferencial, nao irritar com anuncios, responder a dor real) sao os corretos. Abaixo destaco 3 pontos que merecem revisao e 3 que estao perfeitos.", style_body))

    e.append(Paragraph("3.1 Pontos que merecem revisao", style_h2))

    e.append(Paragraph("Ponto 1: Coexistencia vitalicio x mensalidade", style_h3))
    e.append(Paragraph("O mapa nao aborda como o vitalicio atual (R$ 18,90) coexiste com a nova assinatura mensal. Isso e critico porque lancar mensalidade sem estrategia de migracao pode gerar rejeicao. Recomendo: manter vitalicio disponivel por tempo limitado (90 dias apos lancar assinatura) com comunicacao clara de que vai sair de linha, depois remover. Quem ja comprou mantem tudo para sempre. Novos usuarios so podem assinar mensalidade ou comprar vitalicio por R$ 97 (preco cheio, sem desconto de lancamento).", style_body))

    e.append(Paragraph("Ponto 2: Preco da mensalidade muito baixo", style_h3))
    e.append(Paragraph("R$ 9,90 a R$ 19,90/mes e faixa correta para o publico, mas R$ 9,90 e arriscado porque comunica pouco valor e mal cobre custo de processamento (taxa de PIX/boleto + impostos comem 3-5%). Recomendo R$ 14,90/mes ou R$ 119/ano (16% desconto). Isso posiciona o MeuCorre como ferramenta profissional, nao como app gratuito disfarcado. Comparacao: iFood cobra R$ 39/mes do entregador para receber pedidos; R$ 14,90 para gestao financeira e barato sem parecer gratuito.", style_body))

    e.append(Paragraph("Ponto 3: Risco de fragmentar o free", style_h3))
    e.append(Paragraph("Limitar o free a 30 corridas/mes (como proposto na tabela) pode canibalizar o trial de 14 dias. Se o usuario tem 30 corridas gratis por mes, ele pode usar 5 hoje, parar por 5 dias, voltar — nunca sentindo urgencia de pagar. O modelo atual (14 dias trial ilimitado + 5/dia apos) e melhor porque cria urgencia (14 dias contam) e ainda da uso continuo limitado. Recomendo manter o modelo atual e so adicionar limites no free para features avancadas (exportar PDF, metas, relatorios), nao para volume de lancamentos.", style_body))

    e.append(Paragraph("3.2 Pontos que estao perfeitos", style_h2))

    e.append(Paragraph("Acerto 1: Privacidade como diferencial inegociavel", style_h3))
    e.append(Paragraph("Sua colocacao de que dados locais e nao vender dados sao o diferencial esta absolutamente correta. Em um mercado onde iFood e 99 sao vistos como extratores de dados do entregador, o MeuCorre se posiciona como aliado. Isso nao e so etica — e vantagem competitiva. Nunca abrir mao disso nem mesmo por ofertas tentadoras de compra de base. Se um dia monetizar dados, que seja estritamente agregado, anonimizado, e com consentimento explicito (opt-in, nunca opt-out).", style_body))

    e.append(Paragraph("Acerto 2: Ordem de execucao (assinatura -> parcerias -> dados/B2B)", style_h3))
    e.append(Paragraph("A sequencia proposta esta correta. Assinatura valida product-market fit (alguem paga recorrente?). Parcerias escalam receita sem depender de mais usuarios. Dados e B2B sao alavancas de longo prazo que exigem volume e reputacao. Tentar pular etapas (ex: ir direto para B2B sem validar assinatura) e o erro classico que quebra startups. Manter a disciplina da sequencia.", style_body))

    e.append(Paragraph("Acerto 3: Anuncios nativos, nunca banners aleatorios", style_h3))
    e.append(Paragraph("Sua regra de maximo 1-2 espacos de oferta por tela e nao ter banners genericos e essencial. Entregador usa o app para trabalhar, nao para navegar. Anuncio que interrompe o lancamento de corrida gera churn. O modelo ideal e o card de parceiro contextualizado (ex: oferta de posto de gasolina apos registrar 100km no dia, oferta de seguro apos mes de muito ganho). Isso transforma o anuncio em servico util, nao em ruido.", style_body))

    return e


def section_roadmap():
    e = []
    e.append(Paragraph("4. Plano de Implementacao em 4 Fases", style_h1))
    e.append(Paragraph("Abaixo o roadmap detalhado com 4 fases, cada uma com escopo, prazo, entregaveis, e metricas de sucesso. As fases sao acumulativas — cada uma depende da anterior mas nao bloqueia receita futura. A filosofia e validar rapido com esforco baixo antes de investir em frentes complexas.", style_body))

    e.append(Paragraph("4.1 Visao geral do roadmap", style_h2))
    data = [
        [Paragraph("<b>Fase</b>", style_th), Paragraph("<b>Foco</b>", style_th), Paragraph("<b>Prazo</b>", style_th), Paragraph("<b>Receita esperada/mes</b>", style_th), Paragraph("<b>Pre-requisito</b>", style_th)],
        [Paragraph("Fase A", style_td_c), Paragraph("Assinatura + Conveniencia", style_td), Paragraph("0-90 dias", style_td_c), Paragraph("R$ 1k-5k", style_td_c), Paragraph("100+ usuarios ativos", style_td)],
        [Paragraph("Fase B", style_td_c), Paragraph("Parcerias (combustivel)", style_td), Paragraph("90-180 dias", style_td_c), Paragraph("R$ 3k-15k", style_td_c), Paragraph("500+ usuarios ativos", style_td)],
        [Paragraph("Fase C", style_td_c), Paragraph("Parcerias (fintech/seguro) + Comprovante", style_td), Paragraph("180-365 dias", style_td_c), Paragraph("R$ 15k-50k", style_td_c), Paragraph("2k+ usuarios ativos", style_td)],
        [Paragraph("Fase D", style_td_c), Paragraph("B2B, API, dados agregados", style_td), Paragraph("365-730 dias", style_td_c), Paragraph("R$ 50k-200k", style_td_c), Paragraph("5k+ usuarios ativos", style_td)],
    ]
    t = Table(data, colWidths=[15*mm, 50*mm, 22*mm, 35*mm, 38*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), C_DARK), ("TEXTCOLOR", (0,0), (-1,0), white),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING", (0,0), (-1,-1), 4), ("RIGHTPADDING", (0,0), (-1,-1), 4),
        ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, HexColor("#F8FAFC")]),
        ("BOX", (0,0), (-1,-1), 0.3, C_BORDER),
    ]))
    e.append(t)

    e.append(Paragraph("4.2 FASE A — Assinatura + Conveniencia (0-90 dias)", style_h2))
    e.append(Paragraph("Objetivo: validar se entregadores pagam recorrente. Esta fase reusa infraestrutura ja existente (Kiwify para cobranca, Supabase para sync, admin para gestao). Nao ha necessidade de novos servicos externos.", style_body))
    e.append(Paragraph("Entregaveis:", style_h3))
    e.append(Paragraph("• Migrar modelo de cobranca: vitalicio atual mantido, adicionar mensalidade R$ 14,90/mes e anual R$ 119/ano", style_bullet))
    e.append(Paragraph("• Implementar tabela Free vs Pro no app (gatear features como exportar PDF, metas, relatorios)", style_bullet))
    e.append(Paragraph("• Adicionar relatorio PDF mensal (ganhos, despesas, lucro) — gerado client-side via jsPDF, sem custo de servidor", style_bullet))
    e.append(Paragraph("• Implementar comprovante de renda sob consentimento (R$ 9,90 avulso ou incluso no Pro)", style_bullet))
    e.append(Paragraph("• Expor numero de WhatsApp prioritario para usuarios Pro", style_bullet))
    e.append(Paragraph("• Schema Prisma: adicionar campos subscriptionStatus, subscriptionExpiresAt, subscriptionPlan no model User", style_bullet))
    e.append(Paragraph("Metricas de sucesso (90 dias):", style_h3))
    e.append(Paragraph("• 50+ assinantes ativos pagando mensalidade", style_bullet))
    e.append(Paragraph("• Taxa de conversao free->Pro > 5%", style_bullet))
    e.append(Paragraph("• Churn mensal < 8%", style_bullet))
    e.append(Paragraph("• NPS > 40", style_bullet))

    e.append(Paragraph("4.3 FASE B — Parcerias de Combustivel (90-180 dias)", style_h2))
    e.append(Paragraph("Objetivo: validar canal de parcerias com o segmento mais facil (combustivel tem conversao alta porque entregador abastece todo dia). A infraestrutura de anuncios ja existe no painel admin — basta estender para suportar ofertas de parceiros com tracking de conversao.", style_body))
    e.append(Paragraph("Entregaveis:", style_h3))
    e.append(Paragraph("• Fechar 2-3 parcerias com postos ou apps de cashback (Shell Box, Abastece Ai, Petrobras Premmia)", style_bullet))
    e.append(Paragraph("• Implementar card de oferta contextualizada no dashboard (apos 100km/dia, mostrar oferta de posto parceiro proximo)", style_bullet))
    e.append(Paragraph("• Sistema de tracking de conversao (click + install + primeiro abastecimento) via UTM ou deep link", style_bullet))
    e.append(Paragraph("• Schema Prisma: model PartnerOffer (parceiro, oferta, CPA, tracking URL, data inicio/fim, status)", style_bullet))
    e.append(Paragraph("• Landing page para parceiros (/parceiros) explicando o publico e modelo de cobranca", style_bullet))
    e.append(Paragraph("Metricas de sucesso (180 dias):", style_h3))
    e.append(Paragraph("• 3+ parceiros ativos gerando receita", style_bullet))
    e.append(Paragraph("• 500+ clicks/mes em ofertas de parceiros", style_bullet))
    e.append(Paragraph("• 50+ conversoes/mes (instalacao + primeiro uso)", style_bullet))
    e.append(Paragraph("• Receita de parcerias > R$ 3.000/mes", style_bullet))

    e.append(Paragraph("4.4 FASE C — Fintech + Seguro + Comprovante (180-365 dias)", style_h2))
    e.append(Paragraph("Objetivo: escalar parcerias para segmentos de ticket alto (fintech paga R$ 30-80 por conta PJ aberta, seguro paga R$ 50-200 por apolice). O comprovante de renda sob consentimento vira ponte natural — quando o usuario gera comprovante para banco, o MeuCorre pode oferecer parceria de credito pre-aprovado. Modelo win-win: usuario consegue credito, banco ganha lead qualificado, MeuCorre ganha comissao.", style_body))
    e.append(Paragraph("Entregaveis:", style_h3))
    e.append(Paragraph("• Fechar 1-2 parcerias fintech (conta PJ para entregador, credito para moto) — alvos: Banco Inter, Mercado Pago, RecargaPay, C6 Bank", style_bullet))
    e.append(Paragraph("• Fechar 1 parceria de seguro (moto, vida, acidente) — alvos: Porto Seguro, Mapfre, Allianz", style_bullet))
    e.append(Paragraph("• Implementar fluxo de comprovante de renda com consentimento explicito (opt-in) e envio direto para parceiro financeiro", style_bullet))
    e.append(Paragraph("• Dashboard de parceiros no admin (conversoes, receita, CTR por oferta)", style_bullet))
    e.append(Paragraph("• API interna para integracao com parceiros (webhook de conversao, status de lead)", style_bullet))
    e.append(Paragraph("Metricas de sucesso (365 dias):", style_h3))
    e.append(Paragraph("• 5+ parceiros ativos (combustivel + fintech + seguro)", style_bullet))
    e.append(Paragraph("• 200+ comprovantes de renda gerados/mes", style_bullet))
    e.append(Paragraph("• Receita de parcerias > R$ 15.000/mes", style_bullet))
    e.append(Paragraph("• Sem incidentes de privacidade (zero reclamacoes sobre uso indevido de dados)", style_bullet))

    e.append(Paragraph("4.5 FASE D — B2B + API + Dados Agregados (365-730 dias)", style_h2))
    e.append(Paragraph("Objetivo: alavancar volume e reputacao para abrir frentes de receita de ticket alto. B2B (gestao de equipes para cooperativas e restaurantes) e a frente com maior teto de receita por cliente (R$ 50-200/mes por assento de gestor), mas exige product-market fit provado com B2C primeiro. API publica permite que fintechs e plataformas integrem diretamente. Dados agregados anonimizados sao a ultima frente porque dependem de volume critico (5k+ usuarios) e reputacao de privacidade consolidada.", style_body))
    e.append(Paragraph("Entregaveis:", style_h3))
    e.append(Paragraph("• Painel B2B para gestores de equipes (cooperativas, restaurantes): ver todos motoboys, relatorio consolidado, pagamento por corrida", style_bullet))
    e.append(Paragraph("• White label para 1-2 operadoras de delivery (app customizado com marca delas, revenue share)", style_bullet))
    e.append(Paragraph("• API publica documentada (OpenAPI 3.0) para integracao de parceiros — endpoints: /api/v1/income-report, /api/v1/delivery-stats (com consentimento OAuth2)", style_bullet))
    e.append(Paragraph("• Produto de dados agregados (relatorio mensal de mercado: km medio, ganho por app, horarios de pico) — vendido para consultorias e as proprias plataformas", style_bullet))
    e.append(Paragraph("Metricas de sucesso (730 dias):", style_h3))
    e.append(Paragraph("• 10+ clientes B2B ativos (cooperativas/restaurantes)", style_bullet))
    e.append(Paragraph("• 5k+ usuarios ativos mensais", style_bullet))
    e.append(Paragraph("• Receita total > R$ 50.000/mes (assinatura + parcerias + B2B + dados)", style_bullet))
    e.append(Paragraph("• Margem > 60% (custos principais: Vercel, Supabase, processamento de pagamento)", style_bullet))

    return e


def section_risks():
    e = []
    e.append(Paragraph("5. Riscos e Mitigacoes", style_h1))
    e.append(Paragraph("Toda estrategia de monetizacao tem riscos. Abaixo os 5 principais identificados para o MeuCorre, com plano de mitigacao para cada um. A maioria dos riscos nao e tecnica — e de produto e relacionamento.", style_body))

    data = [
        [Paragraph("<b>Risco</b>", style_th), Paragraph("<b>Prob.</b>", style_th), Paragraph("<b>Impacto</b>", style_th), Paragraph("<b>Mitigacao</b>", style_th)],
        [Paragraph("1. Rejeicao de usuarios vitalicios atuais ao ver novos pagando mensalidade", style_td), Paragraph("Alta", style_td_c), Paragraph("Medio (churn)", style_td_c), Paragraph("Comunicar claramente que vitalicio mantem tudo. Oferecer bonus exclusivo para vitalicios (ex: 3 meses de suporte premium)", style_td)],
        [Paragraph("2. Parceiros nao converterem (ofertas ignoradas)", style_td), Paragraph("Media", style_td_c), Paragraph("Alto (receita)", style_td_c), Paragraph("Testar contextualizacao (mostrar oferta so apos acao relevante). A/B test de copy e posicionamento. No maximo 1 oferta por tela.", style_td)],
        [Paragraph("3. Incidente de privacidade (vazamento ou uso indevido)", style_td), Paragraph("Baixa", style_td_c), Paragraph("Critico (reputacao)", style_td_c), Paragraph("Dados de corrida nunca saem do device sem consentimento explicito. Comprovante de renda e opt-in por solicitacao. Auditoria semestral.", style_td)],
        [Paragraph("4. Kiwify nao suportar assinatura recorrente", style_td), Paragraph("Media", style_td_c), Paragraph("Medio (atraso)", style_td_c), Paragraph("Avaliar migrar para Stripe (suporta assinatura BR) ou Pagar.me. Plano B: cobranca mensal via PIX recorrente manual.", style_td)],
        [Paragraph("5. Crescimento de usuarios mais lento que projecao", style_td), Paragraph("Media", style_td_c), Paragraph("Alto (todas fases)", style_td_c), Paragraph("Investir em SEO + programa de referral (ja existe com R$5). Conteudo para entregadores no YouTube/TikTok. Parceria com canais de motociclistas.", style_td)],
    ]
    t = Table(data, colWidths=[55*mm, 18*mm, 25*mm, 52*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), C_DARK), ("TEXTCOLOR", (0,0), (-1,0), white),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING", (0,0), (-1,-1), 4), ("RIGHTPADDING", (0,0), (-1,-1), 4),
        ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, HexColor("#F8FAFC")]),
        ("BOX", (0,0), (-1,-1), 0.3, C_BORDER),
    ]))
    e.append(t)

    return e


def section_first_steps():
    e = []
    e.append(Paragraph("6. Proximos Passos Imediatos (Proximas 2 Semanas)", style_h1))
    e.append(Paragraph("Para nao ficar preso em analise paralisante, recomendo comecar a Fase A imediatamente com 3 acoes concretas nas proximas 2 semanas. Cada uma e pequena o suficiente para ser feita em paralelo com a operacao atual.", style_body))

    e.append(Paragraph("Semana 1 — Validacao com usuarios reais", style_h3))
    e.append(Paragraph("Antes de escrever codigo, falar com 5-10 entregadores reais (nao testers) para validar 3 coisas: (1) eles pagariam R$ 14,90/mes por relatorio PDF + backup + suporte? (2) qual feature os faria pagar imediatamente? (3) como reagem a coexistencia vitalicio x mensalidade? Isso poupa semanas de desenvolvimento em direcao errada. Nao precisa de pesquisa formal — conversa de WhatsApp ou presencial com entregadores que ja usam o app. Usar o feedback popup in-app para coletar isso.", style_body))

    e.append(Paragraph("Semana 2 — Spike tecnico de assinatura", style_h3))
    e.append(Paragraph("Verificar se Kiwify suporta cobranca recorrente (assinatura mensal). Se sim, documentar o fluxo de webhook para renovacao/cancelamento. Se nao, avaliar Stripe (suporta BR via Stripe Brasil) ou Pagar.me como alternativa. Esse spike e so tecnico — sem implementar produto ainda, so validar se a infraestrutura de pagamento suporta o modelo. Em paralelo, comecar a desenhar o schema Prisma atualizado (campos de subscription no model User).", style_body))

    e.append(Paragraph("Decisoes a serem tomadas antes de comecar Fase A", style_h3))
    e.append(Paragraph("• Preco final da mensalidade (R$ 14,90 recomendado)", style_bullet))
    e.append(Paragraph("• Preco do plano anual (R$ 119 recomendado, ~33% desconto)", style_bullet))
    e.append(Paragraph("• Mantem vitalicio disponivel? Por quanto tempo? (90 dias apos lancamento da assinatura recomendado)", style_bullet))
    e.append(Paragraph("• Quais features sao free vs Pro? (sugerido: relatorio PDF, metas, comprovante de renda = Pro; resto = free)", style_bullet))
    e.append(Paragraph("• Cobranca via Kiwify (atual), Stripe, ou Pagar.me?", style_bullet))
    e.append(Paragraph("• Periodo de trial da mensalidade (7 dias gratis? 14 dias?)", style_bullet))

    e.append(Spacer(1, 8))
    e.append(Paragraph("<b>Recomendacao final:</b> comecar a Fase A imediatamente. O MeuCorre ja tem tudo que precisa tecnicamente para lancar assinatura em 30-60 dias. O risco de esperar e maior que o risco de executar — cada mes sem receita recorrente e um mes que a operacao depende exclusivamente de vendas vitalicias unicas. A assinatura e a base que sustenta todas as outras frentes. Valide primeiro, escale depois.", style_body))

    return e


def on_page(canvas, doc):
    canvas.saveState()
    page_num = canvas.getPageNumber()
    if page_num > 1:
        canvas.setStrokeColor(C_NEON)
        canvas.setLineWidth(1.5)
        canvas.line(20 * mm, A4[1] - 15 * mm, A4[0] - 20 * mm, A4[1] - 15 * mm)
        canvas.setFont("NotoSansSC", 8)
        canvas.setFillColor(C_MUTED)
        canvas.drawString(20 * mm, A4[1] - 12 * mm, "MeuCorre — Analise de Monetizacao")
        canvas.drawRightString(A4[0] - 20 * mm, A4[1] - 12 * mm, "Plano de Implementacao")
    canvas.setStrokeColor(C_BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(20 * mm, 15 * mm, A4[0] - 20 * mm, 15 * mm)
    canvas.setFont("NotoSansSC", 8)
    canvas.setFillColor(C_MUTED)
    canvas.drawString(20 * mm, 10 * mm, "MeuCorre PWA — Gestao de Entregas")
    canvas.drawRightString(A4[0] - 20 * mm, 10 * mm, f"Pagina {page_num}")
    canvas.restoreState()


def build():
    doc = SimpleDocTemplate(
        OUTPUT, pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=22 * mm, bottomMargin=22 * mm,
        title="MeuCorre — Analise de Monetizacao e Plano de Implementacao",
        author="Z.ai",
        subject="Analise estrategica de monetizacao — MeuCorre PWA",
        creator="Z.ai PDF Skill",
    )
    story = []
    story.extend(build_cover())
    story.extend(section_diagnosis())
    story.extend(section_evaluation())
    story.extend(section_feedback())
    story.extend(section_roadmap())
    story.extend(section_risks())
    story.extend(section_first_steps())
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    size = os.path.getsize(OUTPUT)
    print(f"PDF gerado: {OUTPUT}")
    print(f"Tamanho: {size / 1024:.1f} KB")


if __name__ == "__main__":
    build()

#!/usr/bin/env python3
"""
Gera o e-book 'Gestão Financeira para Entregadores' (60+ páginas)
Curso completo de finanças práticas para quem vive de entrega por app.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# Fontes
try:
    pdfmetrics.registerFont(TTFont('Body', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
    pdfmetrics.registerFont(TTFont('Body-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
    pdfmetrics.registerFont(TTFont('Body-Italic', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf'))
    BODY, BOLD, ITALIC = 'Body', 'Body-Bold', 'Body-Italic'
except:
    BODY, BOLD, ITALIC = 'Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique'

EMERALD = HexColor('#10b981')
DARK = HexColor('#0f172a')
TEXT = HexColor('#1e293b')
MUTED = HexColor('#64748b')
BG_LIGHT = HexColor('#f8fafc')
BORDER = HexColor('#e2e8f0')

styles = getSampleStyleSheet()
style_cover_title = ParagraphStyle('CoverTitle', fontName=BOLD, fontSize=32, textColor=white, alignment=TA_CENTER, leading=38, spaceAfter=10)
style_cover_sub = ParagraphStyle('CoverSub', fontName=BODY, fontSize=14, textColor=EMERALD, alignment=TA_CENTER, spaceAfter=20)
style_h1 = ParagraphStyle('H1', fontName=BOLD, fontSize=22, textColor=EMERALD, spaceBefore=20, spaceAfter=12, leading=28)
style_h2 = ParagraphStyle('H2', fontName=BOLD, fontSize=16, textColor=DARK, spaceBefore=16, spaceAfter=8, leading=20)
style_h3 = ParagraphStyle('H3', fontName=BOLD, fontSize=13, textColor=EMERALD, spaceBefore=12, spaceAfter=6, leading=16)
style_body = ParagraphStyle('Body', fontName=BODY, fontSize=11, textColor=TEXT, alignment=TA_JUSTIFY, leading=16, spaceAfter=8)
style_callout = ParagraphStyle('Callout', fontName=BODY, fontSize=10, textColor=DARK, alignment=TA_LEFT, leading=14, backColor=BG_LIGHT, borderColor=EMERALD, borderWidth=0, borderPadding=8, spaceBefore=8, spaceAfter=8)
style_toc = ParagraphStyle('TOC', fontName=BODY, fontSize=10, textColor=TEXT, alignment=TA_LEFT, leading=15, leftIndent=10)

def cover():
    f = []
    f.append(Spacer(1, 5*cm))
    f.append(Paragraph('<font color="#10b981" size="50">⚡</font>', ParagraphStyle('Logo', alignment=TA_CENTER, fontSize=50)))
    f.append(Spacer(1, 1*cm))
    f.append(Paragraph('Gestão Financeira<br/>para Entregadores', style_cover_title))
    f.append(Spacer(1, 0.4*cm))
    f.append(Paragraph('O guia completo para lucrar de verdade com entrega por app', style_cover_sub))
    f.append(Spacer(1, 3*cm))
    f.append(HRFlowable(width="40%", thickness=2, color=EMERALD, hAlign='CENTER'))
    f.append(Spacer(1, 0.4*cm))
    f.append(Paragraph('MeuCorre', ParagraphStyle('Brand', fontName=BOLD, fontSize=14, textColor=white, alignment=TA_CENTER)))
    f.append(Paragraph('Edição 2026 · 60 páginas', ParagraphStyle('Author', fontName=BODY, fontSize=11, textColor=HexColor('#94a3b8'), alignment=TA_CENTER)))
    f.append(PageBreak())
    return f

def toc():
    f = []
    f.append(Paragraph('Sumário', style_h1))
    f.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    f.append(Spacer(1, 0.4*cm))
    chapters = [
        ('PARTE I — FUNDAMENTOS', ''),
        ('Cap. 1: Por que entregador precisa de gestão financeira', 'A diferença entre sobreviver e prosperar'),
        ('Cap. 2: Diferença entre faturamento, lucro e lucro líquido', 'Os 3 números que você precisa saber'),
        ('Cap. 3: Custos fixos vs variáveis da entrega', 'O que muda com cada corrida'),
        ('Cap. 4: Calcular o custo real por quilômetro', 'A planilha que muda tudo'),
        ('PARTE II — OPERAÇÃO', ''),
        ('Cap. 5: Separar dinheiro pessoal e de entrega', 'Conta digital PJ na prática'),
        ('Cap. 6: Registro de despesas sem sofrimento', 'Automação é a chave'),
        ('Cap. 7: Controle de combustível inteligente', 'O maior custo variável'),
        ('Cap. 8: Manutenção preventiva vs corretiva', 'R$ 1 hoje economiza R$ 5 amanhã'),
        ('Cap. 9: Depreciação da moto — o custo invisível', 'Como reservar para a próxima troca'),
        ('PARTE III — ESTRATÉGIA', ''),
        ('Cap. 10: Análise de corridas — aceitar ou recusar', 'Limites mínimos por km e por hora'),
        ('Cap. 11: Otimização de rotas e zonas quentes', 'Mapa do tesouro da sua cidade'),
        ('Cap. 12: Horários de pico e janelas de ouro', 'Trabalhar menos, ganhar mais'),
        ('Cap. 13: Multi-app: combinar iFood, 99Food, Rappi', 'Diversificação de renda'),
        ('Cap. 14: Gorjetas, bônus e incentivos', 'Como maximizar cada app'),
        ('PARTE IV — TRIBUTOS E LEGALIZAÇÃO', ''),
        ('Cap. 15: MEI para entregadores — passo a passo', 'Legalização em 30 minutos'),
        ('Cap. 16: DAS mensal — quanto, quando, como pagar', 'A obrigação que mantém você legal'),
        ('Cap. 17: Declaração anual (DASN-SIMEI)', 'Como declarar sem erro'),
        ('Cap. 18: IR Pessoa Física para MEI', 'O que declarar e o que deduzir'),
        ('Cap. 19: Notas fiscais — quando emitir', 'Opcional, mas estratégico'),
        ('PARTE V — RESERVA, INVESTIMENTOS E ESCALA', ''),
        ('Cap. 20: Reserva de emergência — quanto e como', '3 meses de despesas guardadas'),
        ('Cap. 21: Investimentos para iniciantes', 'Tesouro Selic, CDB, poupança'),
        ('Cap. 22: Aposentadoria do entregador', 'INSS por conta própria'),
        ('Cap. 23: Quando comprar uma segunda moto', 'Análise de viabilidade'),
        ('Cap. 24: Contratar outro entregador — quando vale', 'Primeiro passo para frota'),
        ('Cap. 25: Plano de 90 dias para estabilizar', 'Cronograma de execução'),
        ('CONCLUSÃO', ''),
        ('Sobre o MeuCorre', 'O app que automatiza tudo'),
    ]
    for title, sub in chapters:
        if not sub and title.isupper():
            f.append(Spacer(1, 6))
            f.append(Paragraph(f'<b><font color="#10b981">{title}</font></b>', ParagraphStyle('Section', fontName=BOLD, fontSize=11, textColor=EMERALD, spaceBefore=8)))
        else:
            f.append(Paragraph(f'<b>{title}</b>', style_toc))
            if sub:
                f.append(Paragraph(f'<font color="#64748b" size="9">    {sub}</font>', style_toc))
            f.append(Spacer(1, 2))
    f.append(PageBreak())
    return f

def ch(title, sub, paragraphs, callout=None):
    f = []
    f.append(Paragraph(title, style_h1))
    f.append(Paragraph(sub, style_h3))
    f.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    f.append(Spacer(1, 0.3*cm))
    for p in paragraphs:
        f.append(Paragraph(p, style_body))
    if callout:
        f.append(Spacer(1, 0.2*cm))
        f.append(Paragraph(f'<b>💡 {callout}</b>', style_callout))
    f.append(PageBreak())
    return f

def build():
    output = '/home/z/my-project/download/EBOOK-GESTAO-FINANCEIRA-ENTREGADORES.pdf'
    doc = SimpleDocTemplate(output, pagesize=A4,
        leftMargin=2.2*cm, rightMargin=2.2*cm, topMargin=2.2*cm, bottomMargin=2.2*cm,
        title='Gestão Financeira para Entregadores', author='MeuCorre',
        subject='Guia completo de finanças para entregadores de app')
    story = []
    story.extend(cover())
    story.extend(toc())
    
    # PARTE I — FUNDAMENTOS
    story.extend(ch(
        'Cap. 1: Por que entregador precisa de gestão financeira',
        'A diferença entre sobreviver e prosperar',
        [
            'Existe uma frase popular entre entregadores: "eu trabalho pra comer, não pra fazer planilha". É compreensível. Mas é exatamente esse pensamento que mantém milhões de entregadores presos a um ciclo de trabalho duro sem melhora de vida. Vamos entender por quê.',
            'Imagine dois entregadores. Ambos têm a mesma moto 125cc, moram na mesma cidade, trabalham no mesmo app de entrega, faturam cerca de R$ 3.500 por mês. A diferença está no que acontece com esse dinheiro depois que entra.',
            'O primeiro entregador — vamos chamá-lo de João — não controla nada. Recebe os pagamentos na sua conta pessoal, gasta quando precisa, e no fim do mês tenta entender para onde foi o dinheiro. Compra gasolina quando está na reserva, almoça onde estiver, paga contas quando chega a cobrança. No fim do mês, sobram R$ 200-400. Ele acha que "deu pra sobreviver".',
            'O segundo entregador — Clodoaldo — controla tudo. Tem uma conta separada para a entrega, registra cada despesa, sabe que seu custo real é R$ 0,52 por km, separa 5% para reserva, paga o DAS do MEI em dia. No fim do mês, ele sabe que lucrou R$ 1.800 — não R$ 3.500. E dos R$ 1.800, R$ 90 vão para reserva, R$ 180 vão para investimentos, R$ 65 pagam o MEI, e ele se paga um "salário" de R$ 1.200 para viver. Sobram R$ 265 que ficam na conta do negócio para manutenção e melhorias.',
            'A diferença não está no quanto entra — está em quanto <b>sobra organizado</b>. João trabalha 5 anos e continua na mesma situação. Clodoaldo trabalha 5 anos e tem reserva de R$ 5.400, investimentos de R$ 10.800 (rendendo juros), e histórico de renda que permite financiar uma moto nova com taxa de 1,2% ao mês em vez de 4,5%.',
            'A gestão financeira não é sobre "anotar tudo". É sobre <b>saber o suficiente para tomar boas decisões</b>. Decisões como: vale a pena pegar essa corrida? Vale a pena trabalhar domingo? Vale a pena trocar de moto? Vale a pena virar MEI? Vale a pena pegar um segundo app? Sem dados, você responde no "achismo". Com dados, você responde com cálculo.',
            'Este livro vai te dar os dados. Não vai te transformar em contador, não vai te pedir para virar investidor, não vai te enrolar com teoria. Vai te dar exatamente o que você precisa saber para lucrar mais trabalhando o mesmo — ou até menos.',
        ],
        callout='Gestão financeira não é sobre "anotar tudo". É sobre saber o suficiente para tomar boas decisões. Decisões com dados valem 10x mais que decisões no achismo.'
    ))
    
    story.extend(ch(
        'Cap. 2: Diferença entre faturamento, lucro e lucro líquido',
        'Os 3 números que você precisa saber',
        [
            'Esses três termos são confundidos o tempo todo. A confusão custa caro — faz o entregador achar que está indo bem quando está indo mal, ou que está indo mal quando está indo bem. Vamos definir de uma vez por todas.',
            '<b>Faturamento</b> é o total que entra. Se o app de entrega te pagou R$ 187,50 hoje, seu faturamento de hoje foi R$ 187,50. É o número bruto, antes de qualquer desconto. É o que aparece no extrato do banco. <b>Nunca confunda faturamento com lucro.</b>',
            '<b>Lucro</b> é o faturamento menos os custos diretos da atividade. No caso da entrega, são: combustível, alimentação em dia de trabalho, pedágio, estacionamento, manutenção básica (óleo, pneu). Se você faturou R$ 187,50 e gastou R$ 55 nessas despesas diretas, seu lucro foi R$ 132,50.',
            '<b>Lucro líquido</b> é o lucro menos os custos indiretos e fixos. Aqui entram: depreciação da moto (perda de valor por uso), MEI/DAS mensal, seguro, IPVA proporcional, equipamentos (mochila, capacete, luva), celular (depreciação e plano), e o tempo gasto em atividades não remuneradas (esperar corrida, voltar vazio, fazer manutenção).',
            'Vamos recalcular o dia com todos os custos:',
            '<b>Faturamento:</b> R$ 187,50<br/><b>Custos diretos:</b> -R$ 55,00 (combustível R$ 33,60 + alimentação R$ 18 + pedágio R$ 3,40)<br/><b>Lucro:</b> R$ 132,50<br/><b>Custos indiretos:</b> -R$ 30,00 (depreciação R$ 14,40 + manutenção R$ 9,60 + equipamentos R$ 2,40 + MEI/celular R$ 3,60)<br/><b>Lucro líquido:</b> R$ 102,50',
            'Veja: o faturamento era R$ 187,50. O lucro líquido foi R$ 102,50. <b>Diferença de R$ 85 — 45% do que parecia ter sido ganho.</b> Esses R$ 85 não foram para o seu bolso. Foram para o posto de gasolina, para a manutenção, para a perda de valor da moto, para a alimentação que você não teria gastado se estivesse em casa.',
            'Por que isso importa? Porque suas decisões devem ser baseadas no lucro líquido, não no faturamento. Se um app paga R$ 1,50 por km de faturamento, mas seu custo líquido é R$ 0,80/km, o lucro líquido é R$ 0,70/km. Se outro app paga R$ 1,30/km mas seu custo é R$ 0,55/km (porque as corridas são mais curtas e em zonas melhores), o lucro líquido é R$ 0,75/km. <b>O segundo app é melhor, mesmo pagando menos por km.</b>',
            'Aprenda a pensar em lucro líquido. É o número que determina se você está indo para frente ou para trás.',
        ],
        callout='Faturamento ≠ Lucro ≠ Lucro líquido. Decisões baseadas em faturamento = decisões erradas. Decisões baseadas em lucro líquido = decisões que multiplicam renda.'
    ))
    
    story.extend(ch(
        'Cap. 3: Custos fixos vs variáveis da entrega',
        'O que muda com cada corrida',
        [
            'Para controlar bem o dinheiro, você precisa separar os custos em duas categorias: <b>fixos</b> (não mudam com a quantidade de corridas) e <b>variáveis</b> (mudam a cada km rodado). Essa separação é fundamental porque muda a forma como você toma decisões.',
            '<b>Custos fixos</b> são aqueles que você paga igual, trabalhe 1 corrida ou 50 corridas por dia:',
            '<b>•</b> MEI/DAS: R$ 65/mês (fixo independente de faturamento, até o limite)<br/><b>•</b> Seguro da moto: ~R$ 80/mês (R$ 960/ano diluído)<br/><b>•</b> IPVA: ~R$ 50/mês (R$ 600/ano diluído)<br/><b>•</b> Licenciamento: ~R$ 10/mês<br/><b>•</b> Plano de celular: R$ 40/mês<br/><b>•</b> Depreciação da mochila e capacete: R$ 20/mês<br/><b>•</b> Aplicativo de gestão (MeuCorre): R$ 0/mês (gratuito)',
            'Total de custos fixos: ~R$ 265/mês. Esse valor existe mesmo se você não trabalhar nenhum dia. Por isso é importante trabalhar regularmente — os custos fixos diluem.',
            '<b>Custos variáveis</b> são os que mudam com cada km ou cada corrida:',
            '<b>•</b> Combustível: R$ 0,28 por km (moto 125cc, 35 km/L, gasolina R$ 6,50/L)<br/><b>•</b> Manutenção: R$ 0,08 por km (óleo a cada 1.000 km, pneu a cada 12.000 km, corrente a cada 20.000 km)<br/><b>•</b> Depreciação da moto: R$ 0,13 por km (perda de valor por uso)<br/><b>•</b> Alimentação em rua: ~R$ 25 por dia trabalhado<br/><b>•</b> Desgaste de equipamento: R$ 0,02 por km',
            'Total de custos variáveis: R$ 0,51 por km + R$ 25/dia.',
            'Agora veja como isso muda as decisões. Imagine duas opções de dia de trabalho:',
            '<b>Opção A:</b> 100 km, R$ 180 faturamento, 8 horas<br/>Lucro = R$ 180 - (100 × R$ 0,51) - R$ 25 = R$ 180 - R$ 51 - R$ 25 = R$ 104<br/>Por hora: R$ 13<br/>Por km: R$ 1,04',
            '<b>Opção B:</b> 80 km, R$ 175 faturamento, 7 horas<br/>Lucro = R$ 175 - (80 × R$ 0,51) - R$ 25 = R$ 175 - R$ 40,80 - R$ 25 = R$ 109,20<br/>Por hora: R$ 15,60<br/>Por km: R$ 1,36',
            'A Opção B faturou R$ 5 a menos, mas <b>lucrou R$ 5,20 a mais</b> porque rodou menos km (economizou combustível, manutenção e depreciação) e trabalhou 1 hora a menos. <b>Faturar menos e lucrar mais é possível quando você entende custos variáveis.</b>',
            'Outra aplicação: se você precisa fazer R$ 100 extras este mês, vale a pena trabalhar 1 dia a mais? Depende. Se for 100 km com lucro de R$ 1,04/km, vai ganhar R$ 104 líquidos em 8 horas — R$ 13/hora. Vale? Depende da sua alternativa. Se for domingo e você não tem nada para fazer, vale. Se for um dia que você poderia pegar um bico pagando R$ 80 líquidos por 4 horas (R$ 20/hora), não vale — melhor ficar com o bico.',
            'Sem separar custos fixos e variáveis, você não consegue fazer essas contas. Com a separação, cada decisão vira matemática simples.',
        ],
        callout='Separe custos fixos (existem mesmo sem trabalhar) dos variáveis (crescem com cada km). Decisões sobre aceitar trabalho extra devem considerar apenas os variáveis.'
    ))
    
    story.extend(ch(
        'Cap. 4: Calcular o custo real por quilômetro',
        'A planilha que muda tudo',
        [
            'O custo por quilômetro é o número mais importante da sua vida de entregador. Ele define quais corridas aceitar, qual app priorizar, quanto cobrar como frete próprio, e quando vale a pena simplesmente ir para casa. Vamos calculá-lo passo a passo.',
            '<b>Passo 1: Combustível por km</b><br/>Verifique a média de km/L da sua moto. Para 125cc carregando mochila, a média real é 30-35 km/L. Pegue o preço da gasolina e divida pela média:<br/><b>R$ 6,50 ÷ 33 km/L = R$ 0,197/km</b>',
            'Se usa etanol (algumas cidades do interior), recalcule: etanol rende menos (25-28 km/L) mas custa menos (R$ 4,50/L).<br/><b>R$ 4,50 ÷ 26 km/L = R$ 0,173/km</b> — mais barato que gasolina.',
            '<b>Passo 2: Manutenção por km</b><br/>Some os custos anuais de manutenção e divida pelos km rodados por ano (típico: 25.000 km/ano):<br/>Óleo (6 trocas × R$ 60): R$ 360<br/>Pneu dianteiro (1 troca): R$ 200<br/>Pneu traseiro (2 trocas): R$ 360<br/>Corrente + coroa: R$ 350<br/>Pastilha de freio (2 trocas): R$ 120<br/>Bateria: R$ 150<br/>Outros (vela, filtros, ajustes): R$ 200<br/><b>Total anual: R$ 1.740</b><br/><b>Por km: R$ 1.740 ÷ 25.000 = R$ 0,070/km</b>',
            '<b>Passo 3: Depreciação por km</b><br/>Moto nova R$ 14.000. Após 3 anos / 75.000 km vale R$ 5.500. Perda: R$ 8.500 em 75.000 km.<br/><b>Por km: R$ 8.500 ÷ 75.000 = R$ 0,113/km</b>',
            '<b>Passo 4: Equipamentos por km</b><br/>Mochila R$ 200 (dura 2 anos / 50.000 km): R$ 0,004/km<br/>Capacete R$ 300 (dura 4 anos / 100.000 km): R$ 0,003/km<br/>Luva, bota, jaqueta: R$ 0,003/km<br/><b>Total: R$ 0,010/km</b>',
            '<b>Passo 5: Total do custo por km</b><br/>Combustível: R$ 0,197<br/>Manutenção: R$ 0,070<br/>Depreciação: R$ 0,113<br/>Equipamentos: R$ 0,010<br/><b>TOTAL: R$ 0,390 por quilômetro</b>',
            'Esse é o número mágico. Cada km que você roda custa R$ 0,39. <b>Qualquer corrida que pague menos de R$ 0,78/km (2x o custo) está dando prejuízo.</b> Aceitável começa em R$ 1,20/km (lucro de R$ 0,81/km). Bom é R$ 1,80/km+ (lucro de R$ 1,41/km).',
            'Anote seu número em um papel, cole no painel da moto. Toda vez que uma corrida aparecer, calcule: distância × R$ 1,20 (mínimo aceitável). Se o pagamento for menor, recuse. Se for maior, aceite.',
            'Exemplo prático: corrida de 8 km por R$ 14. R$ 14 ÷ 8 = R$ 1,75/km. Aceita. Corrida de 15 km por R$ 18. R$ 18 ÷ 15 = R$ 1,20/km. Limite — só vale se for em horário morto. Corrida de 25 km por R$ 22. R$ 22 ÷ 25 = R$ 0,88/km. Recusa.',
            'O MeuCorre faz esse cálculo automaticamente em cada notificação de corrida. Você vê o R$/km na tela e decide em 2 segundos.',
        ],
        callout='Seu custo por km = R$ 0,39 (exemplo). Mínimo para aceitar: R$ 0,78/km (2x). Aceitável: R$ 1,20/km. Bom: R$ 1,80/km. Recuse abaixo de R$ 0,78 — está perdendo dinheiro.'
    ))
    
    # PARTE II — OPERAÇÃO
    story.extend(ch(
        'Cap. 5: Separar dinheiro pessoal e de entrega',
        'Conta digital PJ na prática',
        [
            'A separação do dinheiro pessoal do dinheiro da entrega é o passo mais importante de todos. Sem isso, nada funciona. Com isso, tudo fica mais claro. É a base sobre a qual todo o resto se constrói.',
            'Por que separar? Três motivos principais:',
            '<b>1. Clareza.</b> Você sabe, em qualquer momento, quanto a entrega está gerando. Sem separação, você mistura salário com lucro, despesa pessoal com despesa de negócio, e fica perdido.',
            '<b>2. Legalização.</b> Como MEI, você precisa ter uma movimentação separada para fins de IR e comprovação. A Receita pode pedir extrato da conta PJ. Misturado, você perde deduções e corre risco de autuação.',
            '<b>3. Crédito.</b> Bancos olham o extrato PJ para aprovar financiamento, cartão, maquininha. Se sua conta PJ tem movimento regular de R$ 3.000-5.000/mês, você consegue crédito que não consegue como pessoa física.',
            'Como separar? Abra uma conta digital gratuita. As melhores opções para entregador em 2026:',
            '<b>Nubank PJ:</b> app excelente, sem mensalidade, cartão físico gratuito, integração com MEI. Emite extrato detalhado.<br/><b>Banco Inter PJ:</b> sem mensalidade, plataforma completa, bom para investir o dinheiro parado.<br/><b>PagBank:</b> aceita Pix imediato, rende 110% do CDI no saldo. Ótimo para reserva.<br/><b>Mercado Pago:</b> integração com Mercado Livre, útil se você também vende online.',
            'Escolha uma. Abra. Demora 15 minutos. Você precisa do CNPJ do MEI (vimos no capítulo anterior como tirar) e um documento de identidade.',
            'Depois de abrir, configure:',
            '<b>Receber:</b> altere nos apps de entrega para pagar nessa conta. iFood, 99Food, Lalamove, Rappi — todos permitem mudar a conta de recebimento. Demora 24-48h para mudança.<br/><b>Pagar:</b> use essa conta para gasolina (Pix no posto), manutenção (transferência para a oficina), alimentação em rua (cartão da conta), pedágio, estacionamento.<br/><b>Reserva:</b> configure para separar 5% automaticamente. No Nubank, dá para criar "caixinhas" que guardam parte do saldo. No Inter, dá para transferir automaticamente todo dia 1o para uma subconta. No PagBank, o saldo já rende sozinho.',
            '<b>Regra de ouro:</b> essa conta é do "negócio entrega". Você não paga aluguel, supermercado, conta de luz, lazer com ela. Esses pagamentos saem da sua conta pessoal. Para mover dinheiro do negócio para o pessoal, faça uma transferência intencional — o "salário" que você se paga.',
            'Quanto se pagar de salário? Sugestão prática: <b>50% do lucro líquido do mês anterior.</b> Se em julho você lucrou R$ 1.800, em agosto se pague R$ 900 como salário. Os outros R$ 900 ficam no negócio para reserva, manutenção, melhorias.',
            'Esse simples sistema muda tudo. Em 30 dias, você saberá exatamente quanto a entrega gera. Em 90 dias, terá dados para IR, crédito e planejamento. Em 1 ano, terá separado automaticamente R$ 1.000-2.000 de reserva sem esforço.',
        ],
        callout='Abra hoje uma conta digital PJ gratuita (Nubank, Inter, PagBank). Receba tudo nela. Pague despesas de entrega nela. Transfira seu "salário" semanalmente. Mudança imediata.'
    ))
    
    story.extend(ch(
        'Cap. 6: Registro de despesas sem sofrimento',
        'Automação é a chave',
        [
            'O maior inimigo do controle financeiro é a fricção. Cada segundo que você gasta registrando uma despesa é um segundo que você vai querer pular. Em 2 semanas, você para de registrar. Em 1 mês, está de volta ao ponto de partida.',
            'A solução é reduzir a fricção ao máximo. O registro precisa ser tão rápido que você faça sem pensar. Vamos ver como.',
            '<b>Nível 1: Automação total (ideal)</b><br/>Use o MeuCorre. O app captura automaticamente as notificações dos apps de entrega e registra cada corrida. Para despesas, você toca em "Lançar despesa", seleciona categoria (já pré-definida: gasolina, alimentação, manutenção, pedágio, outros), digita o valor, pronto. 5 segundos. O app soma tudo, calcula lucro, gera relatórios.',
            '<b>Nível 2: Foto de nota (bom)</b><br/>Use um app como "Organizze" ou "Mobills" que permite fotografar a nota e extrair o valor automaticamente. Demora 10 segundos por despesa. Funciona bem para quem quer dedução no IR.',
            '<b>Nível 3: Planilha no celular (médio)</b><br/>Use Google Sheets ou Excel. Crie uma planilha simples: data, valor, categoria, descrição. Demora 20-30 segundos por despesa. Funciona para quem tem disciplina, mas a maioria desiste em 2-3 semanas.',
            '<b>Nível 4: Caderno (ruim)</b><br/>Caderno de papel. Demora 30-60 segundos por despesa, é fácil de perder, não soma sozinho, não gera relatório. Funciona só para quem tem memória excelente e disciplina de monge.',
            'Recomendamos fortemente o <b>Nível 1 (MeuCorre)</b>. É gratuito, automático, e foi feito especificamente para entregadores. Baixe em meucorre.vercel.app.',
            'Categorias que você deve registrar (em qualquer sistema):',
            '<b>Gasolina:</b> todo abastecimento.<br/><b>Alimentação:</b> todo gasto comendo em rua (café, almoço, lanche, água).<br/><b>Manutenção:</b> óleo, pneu, ajuste, lavagem.<br/><b>Pedágio:</b> todo pedágio pago.<br/><b>Estacionamento:</b> quando pagar para estacionar.<br/><b>Equipamentos:</b> mochila, capacete, luva, bota.<br/><b>Celular:</b> plano, recarga, conserto.<br/><b>Documentos:</b> IPVA, licenciamento, seguro.<br/><b>MEI/DAS:</b> a mensalidade do MEI.<br/><b>Outros:</b> qualquer coisa não classificada.',
            'Não precisa de nota fiscal para despesas abaixo de R$ 50. Basta o valor, a categoria e uma observação curta ("café na padaria"). Para despesas acima de R$ 50, peça nota — pode deduzir no IR.',
            'Meta realista: <b>registrar 100% das despesas acima de R$ 10 e 80% das abaixo.</b> As pequenas somam, mas perfeição é impossível. Se errar R$ 20 em um mês de R$ 200 de despesas pequenas, tudo bem — o importante é capturar a maioria.',
            'Outra dica: <b>registre imediatamente.</b> Não "depois". Não "no fim do dia". Não "quando chegar em casa". Imediatamente. Cada minuto que passa, a chance de esquecer cresce. 5 segundos agora valem mais do que 5 minutos amanhã.',
        ],
        callout='Baixe o MeuCorre. 5 segundos para registrar cada despesa. Em 30 dias, você terá dados completos sem esforço. Automação vence disciplina.'
    ))
    
    story.extend(ch(
        'Cap. 7: Controle de combustível inteligente',
        'O maior custo variável',
        [
            'Combustível é o maior custo variável do entregador — tipicamente 35-45% de todos os custos. Pequenas otimizações aqui geram grandes economias. Vamos ver como reduzir o gasto com gasolina sem perder corridas.',
            '<b>1. Conheça sua real média de km/L</b><br/>Não confie no que diz o manual da moto. Sua média real é menor por causa de: mochila carregada (mais peso), trânsito parado (mais consumo), acelerações bruscas, pneus com pressão errada. Para descobrir sua média real:',
            'Abasteça até o talco (complete o tanque). Zere o hodômetro parcial. Rode normalmente por 200-300 km. Abasteça novamente até o talco. <b>Anote quantos litros entraram e quantos km rodou.</b> Divida km por litros. Esse é seu número real.',
            'Exemplo: 280 km com 8,5 litros = 32,9 km/L. Esse é seu número. Use ele em todos os cálculos.',
            '<b>2. Mantenha pneus calibrados</b><br/>Pneu com 5 PSI abaixo do recomendado aumenta o consumo em 5-8%. Para quem roda 100 km/dia, são 8 km "perdidos" por dia = 240 km/mês = R$ 15/mês a mais de gasolina. Calibre a cada 7 dias. Postos calibram de graça.',
            '<b>3. Use a gasolina certa</b><br/>Moto 125cc flex: teste gasolina vs etanol. Etanol rende menos km/L, mas custa menos. Calcule: se etanol rende 75% da gasolina mas custa 70%, vale a pena. Tipicamente, etanol vale quando custa até 70% do preço da gasolina. Use o app "MotoFlex" para calcular automaticamente.',
            '<b>4. Troque óleo na hora certa</b><br/>Óleo velho aumenta atrito interno do motor = mais consumo. Troque a cada 1.000 km (não a cada 3.000 km como diz o manual — para uso de entrega intensivo, 1.000 km é o correto). Óleo mineral R$ 60, semissintético R$ 80. Vale o semissintético — protege melhor o motor em alta rotação.',
            '<b>5. Evite ocioso</b><br/>Moto parada com motor ligado consome. Se vai esperar mais de 1 minuto, desligue. 10 minutos de ocioso por dia = 1 litro perdido por semana = R$ 26/mês.',
            '<b>6. Abasteça nos postos certos</b><br/>Preço varia R$ 0,30-0,50/L entre postos da mesma cidade. Para um tanque de 8 litros, são R$ 2,40-4,00 por abastecimento. Em 4 abastecimentos por semana (16/mês), são R$ 38-64/mês de economia só escolhendo posto mais barato. Use o app "Menor Preço" da ANP para achar postos baratos perto de você.',
            '<b>7. Considere posto de bandeira branca</b><br/>Postos sem bandeira (independentes) costumam ser 5-10% mais baratos. Desde que o combustível venha de distribuidora licenciada (veja o selo na bomba), a qualidade é a mesma. Economia: R$ 30-50/mês.',
            '<b>8. Plano de fidelidade</b><br/>Alguns postos têm cartão fidelidade — a cada 10 abastecimentos, 1 grátis ou desconto. Para entregador que abastece 4x/semana, são 4 tanques grátis por ano = R$ 200-300.',
            'Somando todas as otimizações: calibragem (-R$ 15/mês), óleo na hora certa (-R$ 10/mês), evitar ocioso (-R$ 26/mês), posto barato (-R$ 50/mês), fidelidade (-R$ 25/mês). <b>Total: R$ 126/mês de economia = R$ 1.512/ano.</b> Sem perder uma única corrida.',
        ],
        callout='Calibre pneus a cada 7 dias. Troque óleo a cada 1.000 km. Abasteça nos postos mais baratos. Use app da ANP. Economia: R$ 1.500/ano só com gasolina.'
    ))
    
    story.extend(ch(
        'Cap. 8: Manutenção preventiva vs corretiva',
        'R$ 1 hoje economiza R$ 5 amanhã',
        [
            'Manutenção preventiva é o investimento com melhor retorno que um entregador pode fazer. Cada R$ 1 gasto em prevenção economiza R$ 5 em conserto de emergência. Cada hora parada para revisão economiza 5 horas paradas para quebra. A matemática é simples — a maioria dos entregadores ainda ignora.',
            'Vamos comparar dois cenários reais:',
            '<b>Cenário A — Entregador preventivo</b><br/>Faz revisão a cada 1.000 km. Troca óleo: R$ 80. Ajusta freio: R$ 30. Calibra pneu: grátis. Limpa corrente: R$ 20. Custo: R$ 130 a cada 1.000 km = R$ 0,13/km.<br/>Quebras em 1 ano: 0. Tempo parado: 0 dias. Custo de emergência: R$ 0.',
            '<b>Cenário B — Entregador reativo</b><br/>Só leva na oficina quando quebra. Não troca óleo a tempo. Não calibra pneu. Não ajusta freio. Custo preventivo: R$ 0.<br/>Quebras em 1 ano: 3 (corrente arrebentou, pastilha acabou e arrastou o disco, motor gripou por falta de óleo). Tempo parado: 12 dias. Custo de emergência: R$ 1.800 (corrente R$ 350, disco + pastilha R$ 450, retífica do motor R$ 1.000).',
            'O Cenário B "economizou" R$ 0 em preventiva e gastou R$ 1.800 em corretiva. O Cenário A gastou R$ 1.300 em preventiva (10 revisões × R$ 130) e R$ 0 em corretiva. <b>Diferença: R$ 500 a favor do preventivo, mais 12 dias de trabalho não perdidos.</b>',
            'Mas o custo real é maior. Os 12 dias parados representam R$ 1.500-2.400 de faturamento perdido. Some: R$ 1.800 de conserto + R$ 2.000 de faturamento perdido = R$ 3.800. <b>O reativo perdeu R$ 3.800 em 1 ano por tentar economizar R$ 1.300.</b>',
            'Cronograma de manutenção preventiva ideal para entregador (uso intenso):',
            '<b>A cada 1.000 km (1x por mês):</b><br/>• Troca de óleo mineral ou semissintético: R$ 60-80<br/>• Ajuste de freio: R$ 20-30<br/>• Calibragem de pneus: grátis<br/>• Limpeza e lubrificação da corrente: R$ 20<br/>• Verificação geral: R$ 0 (incluso)<br/><b>Total: R$ 100-130</b>',
            '<b>A cada 5.000 km (a cada 2 meses):</b><br/>• Tudo do de 1.000 km<br/>• Troca de filtro de óleo: R$ 25<br/>• Troca de vela: R$ 20<br/>• Balanceamento de pneus: R$ 30<br/>• Verificação de suspensão: R$ 0<br/><b>Total adicional: R$ 75</b>',
            '<b>A cada 12.000 km (a cada 6 meses):</b><br/>• Tudo do de 5.000 km<br/>• Troca de pneu traseiro: R$ 180-200<br/>• Troca de pastilha de freio: R$ 60<br/>• Ajuste de carburação/injeção: R$ 50<br/><b>Total adicional: R$ 290-310</b>',
            '<b>A cada 20.000 km (1x por ano):</b><br/>• Tudo do de 12.000 km<br/>• Troca de pneu dianteiro: R$ 180-200<br/>• Troca de corrente + coroa + pinhão: R$ 350<br/>• Troca de bateria: R$ 150<br/>• Revisão completa: R$ 100<br/><b>Total adicional: R$ 780-800</b>',
            'Total anual: 12 × R$ 100 + 6 × R$ 75 + 2 × R$ 300 + 1 × R$ 800 = R$ 1.200 + R$ 450 + R$ 600 + R$ 800 = <b>R$ 3.050/ano</b>.',
            'Parece muito? São R$ 254/mês. Mas evita R$ 3.800/ano de quebras + perda de faturamento. <b>Retorno de 25% ao mês.</b> Não existe investimento melhor.',
            'Encontre uma oficina de confiança. Não leve em concessionária (3-4x mais caro). Procure mecânico independente com boas avaliações no Google. Faça amizade — freguês fiel consegue desconto de 10-15% e atendimento prioritário em emergências.',
            'No MeuCorre, você cadastra o hodômetro atual e o app te avisa automaticamente quando chegar a hora de cada revisão. Sem precisar lembrar.',
        ],
        callout='R$ 254/mês em preventiva economiza R$ 3.800/ano em quebras + faturamento perdido. Retorno de 25% ao mês. Melhor investimento que existe para entregador.'
    ))
    
    story.extend(ch(
        'Cap. 9: Depreciação da moto — o custo invisível',
        'Como reservar para a próxima troca',
        [
            'Depreciação é o custo mais ignorado e mais caro da entrega. Vimos no capítulo anterior que é cerca de R$ 0,13 por km — em 25.000 km/ano, são R$ 3.250/ano de perda silenciosa de valor. Se você não reservar esse dinheiro, vai chegar a hora de trocar a moto e não ter com quê.',
            'Vamos entender a depreciação em detalhe. Sua moto 125cc nova custou R$ 14.000. Após 3 anos de uso intenso (75.000 km), ela vale R$ 5.500 no mercado usado. Você perdeu R$ 8.500 — R$ 2.833/ano, R$ 236/mês, R$ 0,113/km.',
            'Para onde foi esse dinheiro? Para o desgaste natural: motor com menos compressão, suspensão mais frouxa, pintura arranhada, pneus carecas (já trocados, mas a estrutura desgastada), corrente esticada, freios gastos. Cada km rodado destrói um pouquinho da moto. Você não vê, mas está pagando.',
            'A solução é <b>reservar o dinheiro da depreciação</b> em uma conta separada. Cada km que você roda, separa R$ 0,13. Em um dia de 100 km, separa R$ 13. Em um mês de 26 dias × 100 km, separa R$ 338. Em 12 meses, R$ 4.056.',
            'Onde guardar? Em algo que renda juros enquanto espera. Opções:',
            '<b>Tesouro Selic:</b> rende ~12% ao ano (2026), liquidez diária, mínimo R$ 100. Ideal para reserva. Acesse pelo seu banco ou corretora.<br/><b>CDB de banco médio:</b> rende 100-110% do CDI, ~12-13% ao ano. Liquidez diária se for CDB pós-fixado.<br/><b>Poupança:</b> rende 6-8% ao ano + TR. Pior que Tesouro e CDB, mas é simples. Use só se não conseguir abrir outro.',
            'Em 3 anos, com R$ 338/mês reservados a 12% ao ano, você terá: R$ 338 × 36 = R$ 12.168 + juros de ~R$ 2.500 = <b>R$ 14.668</b>. O suficiente para comprar uma moto nova igual, sem financiamento.',
            'Sem essa reserva, o que acontece? Você chega no 3o ano, a moto está velha, quebrando toda hora, vale R$ 5.500. Você precisa de R$ 14.000 para uma nova. Tem R$ 5.500 (da venda da velha). Faltam R$ 8.500. Vai financiar? Em 36x de R$ 380 com juros de 3,5%/mês = R$ 13.680 no total. <b>Você paga R$ 5.180 de juros por não ter reservado.</b>',
            'Como reservar na prática? Configure uma transferência automática. Todo dia que recebe do app (típico: 1x por semana), transfira R$ 0,13 × km rodados na semana para a conta de reserva. Se rodou 700 km na semana, transfere R$ 91.',
            'No MeuCorre, isso é automático. Você cadastra sua moto (valor, km atual), o app calcula R$ 0,13/km e separa sozinho. Todo dia 1o do mês, o app te mostra: "Reserva de depreciação este mês: R$ 338. Saldo acumulado: R$ 2.028."',
            'Parece difícil? Não é. É só hábito. E é o hábito que separa o entregador que sempre tem moto nova do que sempre está preso em financiamento.',
        ],
        callout='Reserve R$ 0,13/km rodado em Tesouro Selic. Em 3 anos, terá ~R$ 14.000 para comprar moto nova à vista. Sem juros, sem financiamento, sem sofrimento.'
    ))
    
    # PARTE III — ESTRATÉGIA
    story.extend(ch(
        'Cap. 10: Análise de corridas — aceitar ou recusar',
        'Limites mínimos por km e por hora',
        [
            'Aceitar todas as corridas é o erro mais comum e mais caro do entregador. Muitas corridas dão prejuízo — você gasta mais em combustível, manutenção e depreciação do que ganha. Aprender a recusar é a skill mais valiosa da profissão.',
            'Vimos que seu custo total é R$ 0,39/km. Para ter lucro, a corrida precisa pagar pelo menos 2x esse valor: R$ 0,78/km. Abaixo disso, você perde dinheiro. Acima, ganha. Quanto acima, mais lucra.',
            'Defina seus limites pessoais. Exemplo para um entregador médio:',
            '<b>Recusa automática:</b> abaixo de R$ 0,80/km<br/><b>Aceita só em horário morto:</b> R$ 0,80 a R$ 1,20/km<br/><b>Aceita normal:</b> R$ 1,20 a R$ 1,80/km<br/><b>Aceita优先:</b> R$ 1,80 a R$ 2,50/km<br/><b>Corrida premium (não recuse):</b> acima de R$ 2,50/km',
            'Também defina limite por hora. Seu tempo vale algo. Calcule: se você quer lucrar R$ 100/dia trabalhando 8 horas, precisa de R$ 12,50/hora. Defina como mínimo aceitável. Abaixo disso, melhor ir para casa.',
            '<b>Recusa automática:</b> abaixo de R$ 15/hora<br/><b>Aceita em horário morto:</b> R$ 15-25/hora<br/><b>Aceita normal:</b> R$ 25-40/hora<br/><b>Aceita优先:</b> R$ 40-60/hora<br/><b>Excelente:</b> acima de R$ 60/hora',
            'Como calcular R$/km e R$/hora na hora? Simples: o app de entrega mostra a distância e o valor. Divida valor pela distância. Para R$/hora, estime o tempo total (incluindo espera e deslocamento) — tipicamente 1.5x o tempo de percurso mostrado no GPS.',
            'Exemplo: corrida de 8 km por R$ 14. GPS mostra 25 min. Tempo real estimado: 37 min (25 + 25% de espera/deslocamento). R$/km = 14/8 = R$ 1,75. R$/hora = 14/0,62 = R$ 22,58. <b>Aceita — está acima do mínimo.</b>',
            'Exemplo: corrida de 22 km por R$ 25. GPS mostra 50 min. Tempo real: 62 min. R$/km = 25/22 = R$ 1,14. R$/hora = 25/1,03 = R$ 24,27. <b>Fronteira — só vale se estiver em horário morto.</b>',
            'Exemplo: corrida de 30 km por R$ 28. GPS mostra 65 min. Tempo real: 80 min. R$/km = 28/30 = R$ 0,93. R$/hora = 28/1,33 = R$ 21,05. <b>Recusa — está abaixo do aceitável.</b>',
            'Mas os apps punem quem recusa, certo? Sim — reduzem sua "taxa de aceitação" e podem te bloquear de algumas campanhas. Mas a punição financeira de aceitar corrida ruim é pior. <b>Nota alta com lucro baixo não paga conta.</b>',
            'Estratégia para minimizar punições: <b>recuse rápido.</b> Não deixe o tempo acabar (conta como recusa igual, mas pior para sua posição na fila do app). Recuse nos primeiros 3 segundos. O app entende que você não estava disponível, não que estava "encurralando".',
            'Outra estratégia: <b>use a regra 3-2-1.</b> Recuse 3 corridas ruins seguidas. O app pode te dar 2 minutos de "time-out" (sem receber novas). Aproveite para beber água, ir ao banheiro. Quando voltar, na próxima corrida boa (1), aceite. Os apps modernos já aceitam esse padrão — não punem mais tanto.',
            'O MeuCorre mostra o R$/km e R$/hora de cada corrida automaticamente quando a notificação chega. Você decide em 2 segundos, sem fazer conta.',
        ],
        callout='Defina limites: mínimo R$ 1,20/km e R$ 25/hora. Recusa rápida (3s) não pune tanto. Aceitar corrida ruim custa mais do que punição do app.'
    ))
    
    story.extend(ch(
        'Cap. 11: Otimização de rotas e zonas quentes',
        'Mapa do tesouro da sua cidade',
        [
            'Em cada cidade, existem zonas onde as corridas pipocam — você mal termina uma e já vem outra. E existem zonas mortas, onde você fica 30 minutos esperando. Saber a diferença é o que separa o entregador que fatura R$ 3.500 daquele que fatura R$ 5.200, trabalhando o mesmo tempo.',
            'Zonas quentes típicas (variam por cidade, mas o padrão é semelhante):',
            '<b>Centro comercial:</b> muito movimento, muitos escritórios, muito almoço corporativo. Pico: 11h-14h.<br/><b>Bairros residenciais verticais (prédios):</b> muita gente vivendo em pouco espaço, pedem delivery o tempo todo. Pico: 19h-22h.<br/><b>Entorno de shoppings:</b> lojistas pedem almoço, clientes pedem jantar, funcionários pedem lanche. Pico: 12h e 19h.<br/><b>Região universitária:</b> estudantes pedem comida barata o dia todo. Pico: 12h e 22h.<br/><b>Bairros corporativos:</b> escritórios grandes. Pico: 11h30-13h30.<br/><b>Zona boemia:</b> bares e baladas. Pico: 22h-3h.',
            'Como descobrir suas zonas quentes? Use os dados do seu próprio histórico. Após 2-3 semanas usando o MeuCorre, o app mostra no mapa onde você pegou mais corridas, em quais horários. Você terá um mapa personalizado da sua cidade.',
            'Sem app, faça assim: durante 2 semanas, anote em um papel o bairro onde cada corrida começou e terminou. No fim, conte. Os bairros com mais marcações são suas zonas quentes.',
            'Estratégia de posicionamento: <b>não patrulhe.</b> Muitos entregadores saem "dando voltas" achando que vão pegar mais corridas. Não pegam — e gastam gasolina. <b>Fique parado em uma zona quente.</b> Quando pegar uma corrida e levar para outra zona, avalie: a nova zona é quente? Fique lá 10 minutos. Se não vier nada, volte para a zona quente mais próxima.',
            'Distância máxima para voltar vazio: <b>3 km.</b> Se você levou uma corrida para um bairro a 5+ km da zona quente, não volte vazio. Fique na nova região por 10 minutos — provavelmente tem entrega local. Voltar vazio gasta gasolina e gera zero receita.',
            'Use o GPS do celular para registrar suas rotas. No fim do dia, veja no mapa quantos km você rodou "em produção" (com corrida) vs "vazio" (sem corrida). Meta: <b>80% em produção, 20% vazio.</b> Se está 60/40, está perdendo tempo e gasolina.',
            'Outra otimização: <b>aprenda os atalhos.</b> O GPS sempre te mostra o caminho "rápido" usando vias principais. Mas você conhece a cidade melhor que o GPS. Descubra atalhos que economizam 2-3 minutos por corrida. Em 30 corridas/dia, são 60-90 minutos economizados — quase 1 hora extra de trabalho produtiva.',
            'Anote em um caderno os atalhos que descobrir. Marque no Google Maps "meus lugares" os pontos de espera bom (sombra, banheiro próximo, café barato). Em 2 meses, você terá um "mapa do tesouro" da sua cidade.',
            'Por fim: <b>conheça os horários de cada zona.</b> O centro comercial é quente no almoço, morto à noite. A zona boêmia é morta de dia, quente à noite. A região universitária é quente o dia todo mas tem picos. Ajuste seu posicionamento conforme o horário muda.',
            'O MeuCorre tem um mapa de calor que mostra suas zonas quentes por horário. Em 2 semanas de uso, você terá o mapa completo da sua cidade — onde ficar em cada hora do dia.',
        ],
        callout='Não patrulhe — fique parado em zonas quentes. Distância máxima para voltar vazio: 3 km. Aprenda atalhos. Mapa do MeuCorre mostra suas zonas quentes por horário.'
    ))
    
    story.extend(ch(
        'Cap. 12: Horários de pico e janelas de ouro',
        'Trabalhar menos, ganhar mais',
        [
            'O entregador médio trabalha 10-12 horas por dia, das 8h às 18h ou 20h. Acha que está "maximizando" o ganho. Mas está cometendo um erro: <b>as horas não valem o mesmo.</b> Uma hora no pico do almoço vale 3x uma hora na tarde morta.',
            'Vamos ver os dados típicos de uma cidade média brasileira:',
            '<b>Manhã (7h-9h):</b> café da manhã, correios corporativos. R$/hora médio: R$ 22-28. Bom horário.<br/><b>Meio da manhã (9h-11h):</b> vale morto. R$/hora médio: R$ 12-18. Horário fraco.<br/><b>Almoço (11h30-14h):</b> pico absoluto. R$/hora médio: R$ 35-50. Janela de ouro.<br/><b>Tarde (14h-17h):</b> vale morto. R$/hora médio: R$ 10-15. Pior horário.<br/><b>Fim de tarde (17h-19h):</b> jantar começando, trânsito pesado. R$/hora médio: R$ 20-28.<br/><b>Jantar (19h-22h):</b> segundo pico. R$/hora médio: R$ 30-45. Janela de ouro.<br/><b>Madrugada (22h-3h):</b> bares e farmácias. R$/hora médio: R$ 28-40 se você gosta de trabalhar à noite.',
            'Veja: das 14h às 17h (3 horas), o R$/hora médio é R$ 12. Você fatura R$ 36 nessas 3 horas. No pico do almoço (11h30-14h, 2,5 horas), o R$/hora é R$ 40. Você fatura R$ 100 nas 2,5 horas. <b>1 hora no pico vale 3 horas no vale morto.</b>',
            'O entregador inteligente <b>não trabalha das 14h às 17h.</b> Ele vai para casa, descansa, almoça com calma, faz uma atividade pessoal. Volta às 18h30 para o pico do jantar. Resultado: trabalha 8 horas (em vez de 12) e fatura o mesmo ou mais.',
            'Comparativo real de um mês:',
            '<b>Entregador A (10h-12h/dia, 26 dias):</b> trabalha 8h-20h todos os dias. Fatura R$ 3.500/mês. Lucro líquido: R$ 1.500. Fadiga: alta. Vida pessoal: inexistente.<br/><b>Entregador B (7h/dia, 26 dias):</b> trabalha 11h-14h + 19h-23h. Fatura R$ 4.200/mês. Lucro líquido: R$ 2.100. Fadiga: média. Vida pessoal: tem.',
            'O Entregador B trabalha <b>30% menos horas</b> e lucra <b>40% mais</b>. Tudo por causa de foco nos picos.',
            'Como descobrir seus horários de pico? Use os dados do seu histórico. Após 2 semanas usando o MeuCorre, o app gera um gráfico de R$/hora por faixa de horário. Você vê claramente quando vale a pena trabalhar e quando não vale.',
            'Sem app, faça assim: por 2 semanas, anote o horário de cada corrida e o valor. No fim, agrupe por faixa de 1 hora (8h-9h, 9h-10h, etc.). Some o faturamento de cada faixa e divida pelo número de horas trabalhadas na faixa. Você terá seu gráfico pessoal.',
            'Outra estratégia: <b>experimente horários diferentes.</b> Se você sempre trabalha 8h-18h, tente por uma semana 11h-15h + 19h-23h. Compare o faturamento. Os números não mentem — você vai ver a diferença.',
            'Finais de semana têm padrão diferente. Sábado: pico estendido do almoço (11h-15h) e jantar (19h-23h). Domingo: pico do almoço (11h-15h) é mais forte que dia de semana, mas à tarde é morto. <b>Domingo à noite costuma ser excelente</b> — poucos entregadores trabalhando, muita gente pedindo comida.',
            'Feriados: similares a domingo, mas com pico ainda mais concentrado. Trabalhar em feriado costuma render 30-50% a mais por hora. Mas avalie: vale a pena perder o feriado com a família? Se precisar do dinheiro, sim.',
            'Personalize. Cada cidade tem seu padrão. Cidades praianas têm pico diferente de cidades do interior. Cidades universitárias têm pico diferente de cidades industriais. Descubra o seu padrão e otimize.',
        ],
        callout='1 hora no pico vale 3 horas no vale morto. Trabalhe 11h-14h + 19h-23h (7h/dia). Faturamento igual ou maior que 12h/dia. Vida pessoal recuperada.'
    ))
    
    story.extend(ch(
        'Cap. 13: Multi-app: combinar iFood, 99Food, Rappi',
        'Diversificação de renda',
        [
            'Trabalhar com um único app de entrega é como ter um único cliente — se ele te bloqueia ou reduz corridas, você perde tudo. Multi-app é a estratégia de diversificação que reduz risco e aumenta renda.',
            'Principais apps de entrega no Brasil em 2026:',
            '<b>iFood:</b> líder de mercado, mais restaurantes, mais clientes. R$/km médio: R$ 1,40-1,80. Exige carteira nacional de entregador (cartão amarelo).<br/><b>99Food:</b> ligado à 99 (transporte). Menos restaurantes mas boas corridas em horários específicos. R$/km médio: R$ 1,30-1,70. Aceita entregadores sem carteira nacional.<br/><b>Rappi:</b> forte em cidades grandes. Faz entrega de mercado, farmácia, dinheiro. R$/km médio: R$ 1,50-2,00. Boas gorjetas.<br/><b>Lalamove:</b> entrega de encomendas maiores (não só comida). Ticket médio maior: R$ 30-80 por entrega. Exige moto 150cc+.<br/><b>Loggi:</b> entrega de documentos e pequenas encomendas. R$/km médio: R$ 1,80-2,50. Rotas mais longas.',
            'Estratégia multi-app:',
            '<b>1. Cadastre-se em 2-3 apps.</b> Não tente 5-6 — não vai conseguir gerenciar. Comece com iFood + 99Food. Adicione Rappi se morar em cidade grande. Lalamove/Loggi se quiser variar comida por encomendas.',
            '<b>2. Tenha o app de cada um aberto simultaneamente.</b> Use celular com tela dividida ou 2 celulares. Quando um app manda corrida ruim, recusa e pega a boa de outro.',
            '<b>3. Conheça os pontos fortes de cada app.</b> iFood: almoço. 99Food: café da manhã. Rappi: jantar e madrugada. Lalamove: dia todo mas ticket maior. Distribua seu tempo conforme os pontos fortes.',
            '<b>4. Compare R$/hora por app.</b> Após 1 mês usando multi-app, você terá dados. Talvez descubra que 99Food paga R$ 22/hora e iFood paga R$ 28/hora. Ajuste seu tempo: mais iFood, menos 99Food.',
            '<b>5. Cuidado com as regras de cada app.</b> Alguns apps punem quem fica offline com frequência. Outros punem quem recusa muito. Leia as regras de cada um. Algumas proíbem usar outro app simultaneamente enquanto está em corrida (mas entre corridas, pode).',
            '<b>6. Use o MeuCorre para consolidar.</b> O app captura notificações de todos os apps de entrega e mostra um relatório unificado. Você vê: "este mês, iFood te deu R$ 1.800 em 80 horas (R$ 22,50/hora), 99Food te deu R$ 1.200 em 60 horas (R$ 20/hora), Rappi te deu R$ 700 em 25 horas (R$ 28/hora)." Decisão clara: foque Rappi.',
            'Cuidado com o erro comum em multi-app: <b>tentar fazer 2 corridas ao mesmo tempo.</b> Não faça. Se aceitar corrida no iFood e o 99Food mandar outra, NÃO aceite a do 99 enquanto estiver na do iFood. Vai atrasar um cliente, tomar nota baixa, e arriscar bloqueio. <b>Uma corrida de cada vez.</b>',
            'Outra dica: <b>não fique online em 5 apps se não vai pegar corridas.</b> Os apps rastreiam sua "disponibilidade" — se você está online mas não aceita, perde pontos. Fique online só nos apps que vai realmente usar naquela hora.',
            'Custos do multi-app: mais desgaste de celular (você precisa de um bom celular, R$ 1.500-2.500), mais consumo de bateria (compre power bank R$ 100-150), mais dados móveis (plano de 10GB+ R$ 50-60/mês). Reserve esses custos.',
        ],
        callout='Cadastre em 2-3 apps (iFood + 99Food + Rappi). Conheça os pontos fortes de cada. Compare R$/hora por app. Foque no que paga melhor. Use MeuCorre para consolidar.'
    ))
    
    story.extend(ch(
        'Cap. 14: Gorjetas, bônus e incentivos',
        'Como maximizar cada app',
        [
            'Os apps de entrega têm vários mecanismos de pagamento além do valor base da corrida. Quem ignora esses mecanismos perde 20-30% de renda potencial. Quem domina, ganha bem mais trabalhando o mesmo.',
            '<b>Gorjetas</b><br/>Cliente pode dar gorjeta no app. Varia de R$ 1 a R$ 20+. Média: R$ 2-3 por gorjeta. Frequência: 5-10% das corridas. Como aumentar?',
            '<b>•</b> Seja educado no chat: "Boa noite! Já estou a caminho, chego em X minutos."<br/><b>•</b> Cumprimente na entrega: "Boa noite! Aqui está seu pedido, aproveite!"<br/><b>•</b> Não esqueça nenhum item (verifique antes de sair do restaurante)<br/><b>•</b> Entregue rápido — quanto menor o tempo, mais chance de gorjeta<br/><b>•</b> Capricho na aparência: moto limpa, mochila organizada, roupa apresentável',
            'Em um mês de 500 corridas com 8% de gorjeta média R$ 3: 40 gorjetas × R$ 3 = R$ 120 extra. Parece pouco, mas são R$ 1.440/ano — uma semana de férias grátis.',
            '<b>Bônus de campanha</b><br/>Cada app tem campanhas: "faça 30 corridas esta semana, ganhe R$ 200 extra", "trabalhe no feriado, ganhe R$ 50/dia extra", "faça 10 corridas no almoço, ganhe R$ 80". <b>Participe de todas que conseguir.</b> São R$ 200-500/mês extras para quem cumpre.',
            'Como se inscrever: geralmente é automático quando você atende aos requisitos (faça X corridas no período). Em alguns apps, precisa ativar a campanha no menu "Promoções". Verifique semanalmente.',
            '<b>Incentivos de horário</b><br/>Apps pagam mais em horários específicos: "Corridas das 11h-14h hoje têm +R$ 3", "Madrugada de sexta paga 1,5x". <b>Trabalhe nesses horários sempre que possível.</b> São os melhores R$/hora do mercado.',
            '<b>Bônus de região</b><br/>Apps pagam mais para corridas em regiões específicas: "Corridas no bairro X hoje pagam +R$ 2". Fique nessas regiões quando os bônus estão ativos. Os apps enviam notificação — preste atenção.',
            '<b>Bônus de indicação</b><br/>Indique outros entregadores. Quando eles se cadastram e fazem as primeiras 50 corridas, você ganha R$ 50-200. Em um ano, se indicar 10 entregadores que cumprem, são R$ 500-2.000 extras. <b>Use seu link de indicação!</b> Tem no menu do app.',
            '<b>Bônus de nota</b><br/>Entregadores com nota 4.8+ recebem prioridade nas corridas boas, acesso a campanhas exclusivas, e em alguns apps, bônus mensal de R$ 100-200. Mantenha nota alta.',
            '<b>Programa de fidelidade</b><br/>Alguns apps (especialmente iFood) têm programas: a cada X corridas, você sobe de nível e recebe benefícios (prioridade, suporte rápido, descontos em oficinas). Verifique no menu do app.',
            '<b>Como acompanhar tudo?</b><br/>O MeuCorre consolida tudo: valor base + gorjetas + bônus + incentivos. Você vê o "lucro total" de cada app, não só o valor base. Comparação justa para decidir qual app priorizar.',
            'Resumo das oportunidades extras:',
            '<b>•</b> Gorjetas: R$ 100-200/mês<br/><b>•</b> Bônus de campanha: R$ 200-500/mês<br/><b>•</b> Incentivos de horário: R$ 100-300/mês<br/><b>•</b> Bônus de região: R$ 50-200/mês<br/><b>•</b> Indicação: R$ 0-200/mês (depende do esforço)<br/><b>•</b> Bônus de nota: R$ 100-200/mês (se manter nota alta)',
            '<b>Total potencial: R$ 550-1.600/mês extras.</b> Sem trabalhar mais horas — apenas sendo estratégico.',
        ],
        callout='Gorjetas + bônus + incentivos = R$ 550-1.600/mês extras. Participe de campanhas, indique colegas, mantenha nota alta, trabalhe horários com incentivo.'
    ))
    
    # PARTE IV — TRIBUTOS E LEGALIZAÇÃO
    story.extend(ch(
        'Cap. 15: MEI para entregadores — passo a passo',
        'Legalização em 30 minutos',
        [
            'MEI (Microempreendedor Individual) é a forma mais barata e simples de legalizar a atividade de entregador. Custa R$ 65/mês, dá CNPJ, acesso a crédito, e te coloca na legalidade. Quem não é MEI está perdendo dinheiro e correndo risco.',
            'Quem pode ser MEI entregador?',
            '<b>•</b> Maior de 18 anos (ou emancipado)<br/><b>•</b> Faturamento até R$ 81.000/ano (R$ 6.750/mês — quase todo entregador está abaixo)<br/><b>•</b> Não ser sócio ou titular de outra empresa<br/><b>•</b> Não ter mais de 1 funcionário',
            'Se você fatura mais de R$ 6.750/mês consistente, precisa migrar para ME (Microempresa) — faturamento até R$ 360.000/ano, com custos maiores mas mais benefícios. Para 95% dos entregadores, MEI é o formato ideal.',
            '<b>Passo a passo para virar MEI:</b>',
            '<b>1. Reúna os documentos</b><br/>• RG e CPF<br/>• Título de eleitor (ou documento alternativo: CNH, passaporte)<br/>• Comprovante de endereço<br/>• Número do recibo do IR último (se já declarou IR alguma vez)',
            '<b>2. Acesse o Portal do Empreendedor</b><br/>Site: portaldoempreendedor.gov.br<br/>Clique em "Quero ser MEI" → "Formalize-se".',
            '<b>3. Faça o cadastro</b><br/>Preencha seus dados pessoais. Escolha a atividade: <b>"Serviços de entrega rápida" (CNAE 5320-2/02)</b>. Se faz entrega de comida quente (iFood, 99Food), também pode adicionar "Transporte de mercadorias" (CNAE 4930-2/02).',
            '<b>4. Defina o nome da empresa</b><br/>Pode ser seu nome (ex: "João Silva Entregador ME") ou um nome fantasia (ex: "Entregas Rápidas João"). O nome fantasia não pode ter marcas registradas.',
            '<b>5. Defina o capital social</b><br/>Coloque R$ 1.000. É só um número simbólico — não precisa depositar.',
            '<b>6. Conclua o cadastro</b><br/>O sistema gera seu CNPJ na hora. Salve o CCMEI (Certificado de Condição de Microempreendedor Individual) — é o documento que comprova que você é MEI.',
            '<b>7. Abra conta bancária PJ</b><br/>Use o CNPJ para abrir conta digital gratuita (Nubank PJ, Inter PJ, PagBank PJ). Demora 15 minutos. Esse passo é fundamental — vimos no capítulo 5.',
            '<b>8. Emita a primeira guia DAS</b><br/>No Portal do Empreendedor, menu "Pagamento de Tributos", gera a guia DAS mensal. Valor fixo: R$ 65 (em 2026, com INSS 5% + R$ 1 fixo ICMS). Pague por Pix ou boleto.',
            'Pronto! Você é MEI. Tempo total: 30-40 minutos. Custo: R$ 0 agora, R$ 65/mês a partir do próximo mês.',
            '<b>O que muda na sua vida?</b>',
            '<b>•</b> CNPJ: pode emitir nota fiscal, abrir conta PJ, pegar crédito<br/><b>•</b> Legalização: não tem mais risco de autuação por atividade informal<br/><b>•</b> INSS: contribui para aposentadoria (5% do salário mínimo)<br/><b>•</b> Acesso a crédito: bancos liberam financiamento com taxa menor<br/><b>•</b> Comprovação de renda: extrato PJ é aceito para alugar imóvel, pegar cartão, financiar moto<br/><b>•</b> Dedução no IR: despesas da atividade são dedutíveis',
            '<b>O que você precisa fazer todo mês:</b>',
            '<b>•</b> Pagar o DAS até dia 20 (R$ 65)<br/><b>•</b> Manter registro de faturamento (MeuCorre faz isso)<br/><b>•</b> Anotar despesas para dedução (MeuCorre também)',
            '<b>O que você precisa fazer todo ano:</b>',
            '<b>•</b> Declarar DASN-SIMEI até 31 de maio (declaração anual, vimos no capítulo 17)<br/><b>•</b> Declarar IR pessoa física (se entrou na faixa, vimos no capítulo 18)',
            'Custo total do MEI: R$ 780/ano (12 × R$ 65). Benefício: legalização, deduções, crédito, aposentadoria. Não existe motivo para não ser MEI.',
        ],
        callout='Vire MEI em 30 minutos no portaldoempreendedor.gov.br. Atividade: "Serviços de entrega rápida" (CNAE 5320-2/02). Custo: R$ 65/mês. Benefício: legalização + crédito + aposentadoria.'
    ))
    
    story.extend(ch(
        'Cap. 16: DAS mensal — quanto, quando, como pagar',
        'A obrigação que mantém você legal',
        [
            'DAS (Documento de Arrecadação do Simples Nacional) é a guia mensal que o MEI paga. É fixo — R$ 65 em 2026. Vence dia 20 de cada mês. Pode pagar atrasado com multa mínima, mas não deixe acumular.',
            'O que compõe o DAS?',
            '<b>•</b> INSS (5% do salário mínimo): R$ 60,60<br/><b>•</b> ICMS (R$ 1 fixo): R$ 1,00<br/><b>•</b> ISS (R$ 5 fixo, se tiver atividade de serviço): R$ 5,00<br/><b>Total: R$ 66,60 — arredondado para R$ 65</b>',
            'Note que o INSS é 5% do salário mínimo. Se o salário mínimo sobe, o DAS sobe. Em 2026 com salário mínimo de R$ 1.212, INSS é R$ 60,60. Se o salário subir para R$ 1.400, INSS sobe para R$ 70 — DAS passa para R$ 75.',
            '<b>O que o DAS te garante?</b>',
            '<b>Aposentadoria:</b> cada mês de DAS paga conta como 1 mês de contribuição. Para se aposentar por idade (65 anos homem, 60 anos mulher), precisa de 180 contribuições (15 anos). Para aposentadoria por tempo de contribuição (30 anos homem, 25 anos mulher), precisa de 180 contribuições. <b>Cada mês sem pagar DAS = 1 mês a menos na aposentadoria.</b>',
            '<b>Auxílio-doença:</b> se ficar doente e não puder trabalhar, tem direito a auxílio-doença (91% do salário de benefício). Exige 12 contribuições mínimas.',
            '<b>Salário-maternidade:</b> se tiver filho, tem direito a 120 dias de salário-maternidade. Exige 10 contribuições mínimas.',
            '<b>Pensão por morte:</b> seus dependentes têm direito a pensão se você falecer.',
            'Ou seja: os R$ 65/mês não são "imposto perdido". São contribuição previdenciária que garante benefícios reais.',
            '<b>Como pagar o DAS?</b>',
            '<b>1. Gere a guia</b><br/>No Portal do Empreendedor (portaldoempreendedor.gov.br), menu "Pagamento de Tributos" → "DAS MEI" → "Emitir Guia de Pagamento". Escolha o mês. Gera um código de barras e QR Code.',
            '<b>2. Pague por Pix (mais rápido)</b><br/>No app do seu banco, escolha "Pix Copia e Cola", cole o código gerado no portal. Confirma. Pronto — pago em 5 segundos.',
            '<b>3. Ou pague por boleto</b><br/>Imprima o boleto ou pague no app do banco escaneando o código de barras. Demora 1-2 dias para compensar. Use só se Pix não funcionar.',
            '<b>Quando pagar?</b><br/>Vence dia 20 de cada mês. Mas <b>você pode pagar adiantado</b> — pode gerar as 12 guias do ano de uma vez e pagar todas (R$ 780). Vantagem: não corre risco de esquecer.',
            '<b>Atrasou?</b><br/>Pague mesmo assim. Tem multa de 0,33% por dia de atraso (limitado a 20%) + juros Selic. Para 1 mês de atraso, multa é ~R$ 6-7. Para 6 meses, multa chega a R$ 78 (limite de 20% de R$ 65). Pague o quanto antes — quanto mais atrasa, mais caro.',
            '<b>Não deixe acumular.</b> Se acumular 12 meses (R$ 780 + multas), pode ter o CNPJ suspenso. Para reativar, paga tudo. Para cancelar o MEI, faz a baixa no Portal do Empreendedor (gratuito) — mas ainda tem que pagar o que deve.',
            '<b>Dica de ouro: automatize o pagamento.</b><br/>Configure no seu banco um "agendamento automático" para pagar o DAS todo dia 15 de cada mês. Nunca mais esquece. O MeuCorre também te lembra por notificação 5 dias antes do vencimento.',
            '<b>Como comprovar pagamento?</b><br/>O comprovante fica disponível no Portal do Empreendedor por 5 anos. Para IR, é só acessar e baixar todos os comprovantes do ano. Guarde os PDFs em uma pasta "MEI - Comprovantes" no Google Drive.',
            'Resumo: DAS é R$ 65/mês, vence dia 20, pague por Pix no Portal do Empreendedor. Não deixe acumular. Automatize. Garante aposentadoria e benefícios previdenciários.',
        ],
        callout='DAS = R$ 65/mês, vence dia 20. Pague por Pix no Portal do Empreendedor. Automatize no banco para dia 15. Garante aposentadoria, auxílio-doença, salário-maternidade.'
    ))
    
    story.extend(ch(
        'Cap. 17: Declaração anual (DASN-SIMEI)',
        'Como declarar sem erro',
        [
            'DASN-SIMEI é a declaração anual do MEI. É <b>obrigatória</b>, mesmo se você faturou pouco. Prazo: até 31 de maio do ano seguinte. Multa por não declarar: mínimo R$ 50. Vamos fazer passo a passo.',
            '<b>Quem precisa declarar?</b><br/>Todo MEI ativo no ano anterior, mesmo que tenha faturado zero. Se você virou MEI em julho de 2025, precisa declarar em 2026 — informando o faturamento de julho a dezembro de 2025.',
            '<b>Quando declarar?</b><br/>De 1o de janeiro a 31 de maio do ano seguinte ao da apuração. Exemplo: faturamento de 2025 é declarado entre 1o/01/2026 e 31/05/2026.',
            '<b>O que declarar?</b><br/>Apenas 3 informações:',
            '<b>1. Faturamento bruto do ano anterior</b><br/>Soma de tudo que entrou pela atividade de entrega. Inclui: corridas pagas pelos apps, gorjetas, bônus, incentivos, fretes próprios. <b>Não</b> inclui: dinheiro de outros trabalhos, vendas de bens pessoais, empréstimos, doações.',
            '<b>2. Teve funcionário?</b><br/>Sim ou não. Se sim, informe os dados.',
            '<b>3. Outras informações</b><br/>Se fez compras no exterior, etc. Para 95% dos entregadores, é "não".',
            '<b>Como saber o faturamento bruto?</b><br/>Soma tudo que entrou na sua conta PJ (a conta separada que você abriu no capítulo 5). Não tem como errar se você usou a conta PJ corretamente.',
            'Exemplo: em 2025, você faturou R$ 3.000/mês em média. Total: R$ 36.000. É esse número que você declara.',
            '<b>O MeuCorre gera esse número automaticamente.</b> No app, vai em "Relatórios" → "Anual" → seleciona o ano → copia o "Faturamento bruto" e cola na DASN-SIMEI.',
            '<b>Passo a passo da declaração:</b>',
            '<b>1. Acesse o Portal do Empreendedor</b><br/>Site: portaldoempreendedor.gov.br → menu "Serviços" → "Declaração Anual" → "DASN-SIMEI".',
            '<b>2. Informe o CNPJ</b><br/>Digite seu CNPJ. O sistema identifica sua empresa.',
            '<b>3. Escolha o ano de apuração</b><br/>Selecione o ano anterior (ex: 2025).',
            '<b>4. Informe o faturamento bruto</b><br/>Digite o número. Ex: R$ 36.000,00. (Use vírgula, não ponto.)',
            '<b>5. Responda se teve funcionário</b><br/>Para 95% dos entregadores: "Não".',
            '<b>6. Responda as outras perguntas</b><br/>Geralmente "Não" para todas.',
            '<b>7. Confira e transmita</b><br/>O sistema mostra um resumo. Confira. Se estiver certo, clique em "Transmitir". Gera um recibo em PDF. <b>Salve o recibo!</b>',
            '<b>8. Pronto</b><br/>Declaração feita. Tempo total: 10 minutos.',
            '<b>O que acontece se eu errar?</b><br/>Pode retificar. Volta no Portal, gera uma nova declaração substitutiva, corrige o número, transmite. Sem multa se fizer antes do prazo final (31/05).',
            '<b>E se eu não declarar?</b><br/>Multa de R$ 50 (mínimo) a R$ 200. É cobrada quando você for entregar a próxima declaração. Além disso, o CNPJ pode ser suspenso após 2 anos sem declarar.',
            '<b>E se eu faturei mais de R$ 81.000?</b><br/>Você saiu do MEI. Precisa migrar para ME (Microempresa) e fazer a declaração por outro sistema (DCTF, ECF, etc.). Procure um contador. Custo: R$ 100-200/mês de honorários.',
            '<b>Dica de ouro: declare em fevereiro.</b><br/>Não deixe para maio. Em maio, o Portal fica lento (muita gente deixando para última hora). Em fevereiro, é rápido. Faça em fevereiro, fique tranquilo.',
            'O MeuCorre te lembra em 1o de fevereiro: "Está na hora de declarar a DASN-SIMEI. Seu faturamento de 2025 foi R$ 36.000. Clique aqui para declarar." Você clica, vai direto pro Portal, cola o número, pronto.',
        ],
        callout='DASN-SIMEI até 31/05. Declare o faturamento bruto do ano anterior. 10 minutos no Portal do Empreendedor. MeuCorre gera o número automaticamente. Multa por não declarar: R$ 50+.'
    ))
    
    story.extend(ch(
        'Cap. 18: IR Pessoa Física para MEI',
        'O que declarar e o que deduzir',
        [
            'MEI precisa declarar IR Pessoa Física? Depende. Se você se encaixa nas regras de obrigatoriedade, sim. Vamos ver quando é obrigatório e como declarar corretamente.',
            '<b>Quem é obrigado a declarar IR Pessoa Física em 2026?</b>',
            '<b>•</b> Quem recebeu rendimentos tributáveis acima de R$ 33.919,80 em 2025<br/><b>•</b> Quem recebeu rendimentos isentos, não tributáveis ou tributados exclusivamente na fonte acima de R$ 40.000,00<br/><b>•</b> Quem obteve, em qualquer mês, ganho de capital na alienação de bens ou direitos<br/><b>•</b> Quem realizou operações em bolsas de valores, mercadorias, futuros e assemelhadas<br/><b>•</b> Quem teve posse ou propriedade de bens e direitos acima de R$ 300.000<br/><b>•</b> Quem passou à condição de residente no Brasil',
            '<b>O entregador MEI precisa declarar?</b><br/>Depende do faturamento. Se faturou até R$ 33.919,80 (R$ 2.827/mês), NÃO precisa. Se faturou mais, SIM precisa.',
            'Mas mesmo se não é obrigatório, vale a pena declarar — pode receber restituição.',
            '<b>Como o MEI declara IR?</b>',
            'Como MEI, você recebe da empresa (de você mesmo) um "pró-labore" — seu salário. Esse pró-labore é tributável na pessoa física. <b>Mas você não precisa necessariamente pegar pró-labore.</b> Pode simplesmente sacar o dinheiro como "distribuição de lucros" — que é isenta de IR.',
            '<b>Regra prática:</b> se você fatura até R$ 6.750/mês (limite MEI), pode distribuir todo o lucro como "lucro isento". Não paga IR sobre isso. Não precisa declarar (se não se enquadra em outras regras de obrigatoriedade).',
            'Exemplo: você faturou R$ 4.000/mês em 2025. Total: R$ 48.000. Despesas: R$ 28.000. Lucro: R$ 20.000. Você pode sacar os R$ 20.000 como "lucro isento" (sem IR).',
            '<b>Como declarar (se precisar ou quiser):</b>',
            '<b>1. Declare o faturamento</b><br/>Na ficha "Rendimentos Isentos e Não Tributáveis", linha 09 (Rendimentos de sócio ou titular). Coloque o valor do lucro distribuído (faturamento - despesas - DAS). Ex: R$ 20.000.',
            '<b>2. Declare as despesas</b><br/>Não precisa detalhar despesa por despesa. Apenas guarde os comprovantes por 5 anos caso a Receita peça. A Receita só pede se houver inconsistência.',
            '<b>3. Declare o DAS pago</b><br/>Na ficha "Rendimentos Tributáveis Recebidos de Pessoa Jurídica", se você pegou pró-labore. Se só distribuiu lucro, ignora essa ficha.',
            '<b>4. Declare bens e direitos</b><br/>Se você tem moto, conta bancária com saldo acima de R$ 1.000, etc. Coloque o valor de custo da moto (não o valor atual). Ex: "Moto Honda CG 125 - R$ 14.000".',
            '<b>Como deduzir despesas (se pegar pró-labore):</b><br/>Se você optar por pegar pró-labore (em vez de só distribuir lucro), as despesas da atividade são dedutíveis:',
            '<b>•</b> Combustível (com notas)<br/><b>•</b> Manutenção da moto (com notas)<br/><b>•</b> Depreciação da moto (12,5% ao ano do valor)<br/><b>•</b> Equipamentos (mochila, capacete)<br/><b>•</b> Celular (proporcional ao uso profissional)<br/><b>•</b> Plano de dados (proporcional)<br/><b>•</b> IPVA, licenciamento, seguro da moto<br/><b>•</b> DAS pago no ano<br/><b>•</b> Alimentação em dia de trabalho (limitado)',
            'Total de despesas dedutíveis típico: R$ 12.000-18.000/ano. Reduz a base de cálculo do IR. Para quem fatura R$ 50.000 e tem R$ 15.000 de despesas dedutíveis, a base cai para R$ 35.000 — pode sair da faixa de obrigatoriedade ou receber mais restituição.',
            '<b>Dica: use o MeuCorre.</b><br/>O app gera um relatório anual pronto para IR: faturamento bruto, despesas por categoria, DAS pago, depreciação calculada. Você copia os números e cola no programa da Receita.',
            '<b>Prazo:</b> declaração anual de IR PF vence em 31 de maio. Mesma época da DASN-SIMEI. Faça as duas juntas em fevereiro.',
            '<b>Restituição:</b> se você teve IR retido na fonte (em outros rendimentos) ou tem dependentes, pode receber restituição. Em 2026, lotes começam em junho. Quem declara cedo (fevereiro) recebe nos primeiros lotes.',
        ],
        callout='MEI só declara IR PF se faturou +R$ 33.919,80/ano. Distribua lucro como "isento" (sem pró-labore) e evita IR. Despesas da atividade são dedutíveis. MeuCorre gera relatório pronto.'
    ))
    
    story.extend(ch(
        'Cap. 19: Notas fiscais — quando emitir',
        'Opcional, mas estratégico',
        [
            'MEI tem direito a emitir notas fiscais. É opcional para a maioria das atividades, mas pode ser estratégico. Vamos ver quando vale a pena emitir.',
            '<b>MEI é obrigado a emitir nota fiscal?</b><br/>Para a maioria das atividades: <b>não.</b> Para entrega de comida e small packages (caso de iFood, 99Food, Rappi), você não precisa emitir nota — o app já emite para o cliente.',
            '<b>Quando o MEI é obrigado a emitir nota?</b><br/>Quando o cliente é outra empresa (PJ) e pede a nota. Ou quando você faz entrega para pessoa física (PF) e o valor é alto (acima de R$ 10.000).',
            '<b>Quando vale a pena emitir nota mesmo sem ser obrigatório?</b>',
            '<b>1. Quando você faz entrega direta para outra empresa</b><br/>Ex: uma loja te paga para entregar 50 encomendas por mês. A loja quer nota para deduzir no IR dela. Sem nota, perde o cliente. Com nota, fecha contrato.',
            '<b>2. Quando você faz frete próprio</b><br/>Ex: leva documentos para um escritório, cobra R$ 80 por entrega. O escritório pede nota. Sem nota, não fecha.',
            '<b>3. Para comprovar renda</b><br/>Algumas instituições (bancos, imobiliárias) aceitam notas fiscais emitidas como comprovação de renda. Mais notas = mais renda comprovada = mais crédito.',
            '<b>4. Para deduzir no IR</b><br/>Notas emitidas aumentam seu faturamento declarado — o que pode parecer ruim, mas aumenta sua base de crédito e comprovação.',
            '<b>Como emitir nota fiscal de MEI?</b>',
            '<b>Opção 1: Nota Fiscal de Serviços Eletrônica (NFS-e)</b><br/>Emitida pela Prefeitura da sua cidade. Cada cidade tem um sistema. Acesse o portal da Prefeitura, procure "Nota Fiscal Eletrônica" ou "NFS-e". Cadastre-se como MEI. Gera nota em 2 minutos. Grátis.',
            '<b>Opção 2: Nota Fiscal de Produto (NF-e)</b><br/>Para venda de produtos (não é o caso de entrega, mas se você vende algo). Mais complexa — exige certificado digital. MEI geralmente não usa.',
            '<b>Opção 3: Nota Fiscal Avulsa</b><br/>Emitida pela Sefaz do estado. Para uso esporádico. Mais simples que NF-e. Custa pequena taxa (R$ 5-10 por nota).',
            'Para entregador, a <b>NFS-e da Prefeitura</b> é a opção ideal. Veja se sua cidade oferece. Algumas cidades pequenas não têm sistema — nesse caso, use nota avulsa.',
            '<b>Como emitir NFS-e (passo a passo):</b>',
            '<b>1.</b> Acesse o portal da Prefeitura, menu "Nota Fiscal Eletrônica"<br/><b>2.</b> Cadastre-se como MEI (CNPJ, RG, endereço)<br/><b>3.</b> Escolha "Emitir Nota Fiscal"<br/><b>4.</b> Preencha: dados do cliente (CPF/CNPJ), descrição do serviço ("Serviço de entrega"), valor<br/><b>5.</b> Gere a nota. Vai em PDF. Envie para o cliente.<br/><b>6.</b> Pronto! Nota emitida.',
            'Tempo: 5 minutos por nota. Custo: R$ 0.',
            '<b>Quantas notas emitir?</b><br/>Se você faz entrega via apps, nenhuma — os apps emitem. Se faz entrega direta, emita para cada cliente PJ. Se faz frete próprio, emita para cada corrida acima de R$ 50.',
            '<b>Como guardar as notas?</b><br/>Salve os PDFs em uma pasta "MEI - Notas Fiscais" no Google Drive. Organize por ano e mês. Para IR, basta ter os PDFs guardados — a Receita pede só se houver inconsistência.',
            '<b>Cuidado com a inutilização de notas.</b><br/>Se você emitir nota com erro (valor errado, cliente errado), precisa inutilizar e emitir nova. Não pode simplesmente ignorar — a nota existe no sistema da Prefeitura.',
            'Resumo: para entregador via apps, não precisa emitir nota. Para entrega direta/frete próprio, emita NFS-e da Prefeitura. Grátis, rápido, estratégico para comprovação de renda e dedução.',
        ],
        callout='Para entrega via apps: não precisa de nota. Para entrega direta/frete próprio: emita NFS-e na Prefeitura (grátis, 5 min/nota). Estratégico para renda e crédito.'
    ))
    
    # PARTE V — RESERVA, INVESTIMENTOS E ESCALA
    story.extend(ch(
        'Cap. 20: Reserva de emergência — quanto e como',
        '3 meses de despesas guardadas',
        [
            'Reserva de emergência é o dinheiro guardado para imprevistos: moto quebra, doença, queda de faturamento, emergência familiar. Sem reserva, qualquer problema vira crise. Com reserva, você tem tranquilidade para resolver.',
            '<b>Quanto guardar?</b><br/>3 a 6 meses de despesas. Para entregador solteiro: 3 meses. Para entregador com família: 6 meses.',
            'Calcule suas despesas mensais:',
            '<b>Pessoais:</b> aluguel, alimentação, contas, transporte pessoal, lazer, saúde<br/><b>Profissionais:</b> gasolina, manutenção, DAS, seguro, IPVA proporcional<br/><b>Total típico:</b> R$ 2.500 (solteiro) a R$ 5.000 (família)',
            'Meta de reserva: R$ 7.500 (3 meses solteiro) a R$ 30.000 (6 meses família).',
            '<b>Como construir a reserva?</b><br/>Separe 5% de tudo que entra. Recebeu R$ 100 do app? R$ 5 vão para reserva. Recebeu R$ 1.000? R$ 50 vão para reserva.',
            'Em um mês faturando R$ 3.500: R$ 175 para reserva. Em 12 meses: R$ 2.100. Em 24 meses: R$ 4.200 + juros. Em 36 meses: R$ 6.300 + juros = ~R$ 7.500 (meta de 3 meses para solteiro).',
            'Parece demorado? É. Mas é a única forma realista. Tentar guardar 30% de uma vez quebra o orçamento — você desiste em 2 meses. 5% é sustentável.',
            '<b>Onde guardar?</b><br/>Precisa de duas características: <b>liquidez diária</b> (sacar a qualquer momento) e <b>rendimento</b> (juros enquanto espera).',
            '<b>Opção 1: Tesouro Selic</b><br/>Rende ~12% ao ano (2026). Liquidez diária. Mínimo R$ 100. Sem taxa. Acesse pelo seu banco ou corretora. <b>Melhor opção.</b>',
            '<b>Opção 2: CDB de banco médio</b><br/>Rende 100-110% do CDI (12-13% ao ano). Liquidez diária se for pós-fixado. Garantia do FGC até R$ 250.000. Bom para valores maiores.',
            '<b>Opção 3: Conta digital que rende</b><br/>Nubank rende 100% do CDI no saldo. PagBank rende 110% do CDI. Banco Inter rende 100% do CDI. <b>Pode usar diretamente no app do banco.</b> Mais simples, menos burocracia.',
            '<b>Opção 4: Poupança</b><br/>Rende 6-8% ao ano + TR. <b>Pior opção.</b> Use só se não conseguir abrir outra. Perde para a inflação.',
            'Recomendado: <b>Tesouro Selic ou conta digital que rende</b>. Liquidez imediata, rendimento decente, sem burocracia.',
            '<b>Como automatizar?</b>',
            '<b>1.</b> Configure no seu banco uma transferência automática todo dia que recebe do app. Ex: toda terça (dia que iFood paga), transfere R$ 25 (5% de R$ 500) para a conta de reserva.<br/><b>2.</b> Ou use o MeuCorre: o app calcula 5% do que entrou e te mostra "Reserva de hoje: R$ 25. Total acumulado: R$ 1.200." Você só confirma a transferência.',
            '<b>Quando usar a reserva?</b>',
            '<b>•</b> Moto quebra e precisa de conserto urgente<br/><b>•</b> Você fica doente e não pode trabalhar por 1 semana<br/><b>•</b> Faturamento cai muito em um mês (acidente, lockdown, etc.)<br/><b>•</b> Emergência familiar (morte, doença)<br/><b>•</b> Perda de equipamento essencial (celular, moto roubada)',
            '<b>NÃO use a reserva para:</b>',
            '<b>•</b> Comprar algo que não é urgente (TV nova, viagem)<br/><b>•</b> Pagar conta que podia esperar<br/><b>•</b> Investir em "oportunidade" (reserva não é capital de investimento)<br/><b>•</b> Emprestar para amigo ou familiar',
            '<b>Regra de ouro:</b> reserva é para emergências. Se usar, <b>reponha o quanto antes.</b> Reduza gastos por 2-3 meses para repor.',
            'Quando a reserva atinge a meta (3-6 meses de despesas), pode parar de adicionar e começar a investir o excedente. Mas não pare antes — reserva completa é o pré-requisito para investir com tranquilidade.',
        ],
        callout='Meta: 3-6 meses de despesas guardadas em Tesouro Selic ou conta que rende. Separe 5% de tudo que entra. Em 3 anos, terá R$ 7.500+ guardados. Use só em emergência real.'
    ))
    
    story.extend(ch(
        'Cap. 21: Investimentos para iniciantes',
        'Tesouro Selic, CDB, poupança',
        [
            'Depois de formar a reserva de emergência (capítulo 20), você tem dinheiro sobrando. O que fazer? Investir. Mas investir com sabedoria — sem cair em golpes, sem arriscar o que não pode perder.',
            '<b>Princípios do investidor iniciante:</b>',
            '<b>1. Não invista o que não pode perder.</b> Reserve primeiro (3-6 meses), invista o excedente.<br/><b>2. Desconfie de "oportunidades" com rentabilidade acima de 15% ao ano.</b> São golpes ou risco altíssimo.<br/><b>3. Comece pelo mais simples.</b> Tesouro Selic primeiro. Depois CDB. Depois, talvez, ações.<br/><b>4. Diversifique.</b> Não coloque tudo em um investimento só.<br/><b>5. Pense longo prazo.</b> Investimento bom rende em anos, não em dias.',
            '<b>Tipos de investimento para iniciantes:</b>',
            '<b>1. Tesouro Selic</b><br/>Você empresta dinheiro ao governo federal. Rende a taxa Selic (atual 12% ao ano em 2026). Liquidez diária. Mínimo R$ 100. Sem risco (governo federal não calota).<br/><b>Ideal para:</b> reserva de emergência, investimento de curto prazo.',
            '<b>2. Tesouro IPCA+</b><br/>Rende inflação (IPCA) + taxa fixa (ex: 6% ao ano). Em 2026, rende ~12-13% ao ano. Liquidez diária mas com mark-to-market (pode ter perda se sacar antes do vencimento).<br/><b>Ideal para:</b> investimento de médio/longo prazo (3+ anos).',
            '<b>3. CDB (Certificado de Depósito Bancário)</b><br/>Você empresta dinheiro a um banco. Rende 100-120% do CDI (12-14% ao ano). Garantia do FGC até R$ 250.000. Liquidez varia — pode ser diária ou no vencimento.<br/><b>Ideal para:</b> reserva de emergência (se CDB pós-fixado com liquidez diária) ou investimento de médio prazo.',
            '<b>4. LCI/LCA</b><br/>Rendimento isento de IR. 90-100% do CDI. Liquidez geralmente no vencimento (2-3 anos). Mínimo R$ 5.000-10.000.<br/><b>Ideal para:</b> investimento de médio prazo se você está em faixa de IR alta (27,5%).',
            '<b>5. Fundos de investimento</b><br/>Você entrega o dinheiro para um gestor profissional. Ele investe em diversos ativos. Cobram taxa de administração (1-2% ao ano). Rendimento varia.<br/><b>Ideal para:</b> quem não quer gerenciar. Mas cuidado com taxas altas — comem o rendimento.',
            '<b>6. Ações</b><br/>Você compra fração de uma empresa (Petrobras, Vale, Itaú, etc.). Rendimento vem de dividendos + valorização da ação. Pode ganhar muito (50%+ ao ano) ou perder muito (-30%).<br/><b>Ideal para:</b> longo prazo (5+ anos) e quem tem estômago para ver o saldo variar.',
            '<b>7. FIIs (Fundos Imobiliários)</b><br/>Você investe em imóveis (shoppings, galpões, salas). Rendimento vem de aluguel (distribuído mensalmente). Isento de IR. Rendimento típico: 8-10% ao ano + valorização.<br/><b>Ideal para:</b> renda passiva mensal.',
            '<b>8. Criptomoedas</b><br/>Bitcoin, Ethereum, etc. Extrema volatilidade. Pode ganhar 100% ou perder 80% em meses. <b>Não recomendado para iniciantes.</b> Se quiser, limite a 5% do patrimônio.',
            '<b>Estratégia recomendada para entregador iniciante:</b>',
            '<b>1a fase (0-12 meses):</b> 100% Tesouro Selic. Forme a reserva, ganhe 12% ao ano, sem risco. Simples e seguro.',
            '<b>2a fase (12-24 meses):</b> 60% Tesouro Selic + 40% CDB pós-fixado. Continue segurado, mas diversifique entre governo e bancos.',
            '<b>3a fase (24+ meses):</b> 40% Tesouro Selic + 30% CDB + 20% LCI/LCA + 10% FIIs. Maior diversificação, mais renda passiva.',
            '<b>4a fase (só depois de muito estudo):</b> adicione 5-10% em ações. Acompanhe empresas, dividendos, resultados.',
            '<b>Onde investir?</b>',
            '<b>Banco digital:</b> Nubank, Inter, PagBank oferecem investimentos direto no app. Simples, sem burocracia. Boa para iniciantes.<br/><b>Corretora independente:</b> XP, Rico, Clear, Easynvest. Mais opções, melhor atendimento especializado.<br/><b>Banco tradicional:</b> Itaú, Bradesco, Santander. Mais taxas, menos opções. <b>Evite se possível.</b>',
            'Recomendado: <b>Nubank ou Inter</b> para começar. Quando atingir R$ 10.000, considere migrar para XP ou Rico.',
            '<b>IR sobre investimentos:</b>',
            '<b>Tesouro Selic:</b> 15-22,5% de IR sobre o rendimento (depende do prazo).<br/><b>CDB:</b> 15-22,5% de IR sobre o rendimento.<br/><b>LCI/LCA:</b> isento de IR.<br/><b>FIIs:</b> isento de IR sobre rendimento.<br/><b>Ações:</b> 15-20% de IR sobre lucro + 0,5% de taxa de B3.',
            'A própria instituição financeira recolhe o IR automaticamente. Você não precisa calcular. Apenas declare no IR anual.',
            '<b>Quanto investir por mês?</b><br/>Depois de formar a reserva, 10-20% do lucro líquido. Ex: lucro de R$ 2.000/mês, invista R$ 200-400. Em 12 meses, R$ 2.400-4.800 investidos + rendimento.',
        ],
        callout='Comece pelo Tesouro Selic (12% ao ano, sem risco). Use Nubank ou Inter. Quando atingir R$ 10.000, diversifique para CDB e LCI/LCA. Evite cripto até ter experiência.'
    ))
    
    story.extend(ch(
        'Cap. 22: Aposentadoria do entregador',
        'INSS por conta própria',
        [
            'Aposentadoria é o maior medo do entregador. "Vou poder parar um dia?" A resposta depende do que você faz hoje. Vamos ver como se aposentar corretamente como MEI.',
            '<b>O MEI já contribui para aposentadoria?</b><br/>Sim! O DAS mensal (R$ 65) já inclui 5% do salário mínimo para o INSS. Cada mês de DAS pago = 1 mês de contribuição. Em 15 anos (180 contribuições), você tem direito à aposentadoria por idade.',
            '<b>Tipos de aposentadoria para MEI:</b>',
            '<b>1. Aposentadoria por idade</b><br/>Idade: 65 anos (homem) ou 62 anos (mulher, em 2026). Carência: 180 contribuições (15 anos).<br/>Valor: 60% da média das contribuições + 2% por ano acima de 15 anos (para homem) ou 20 anos (para mulher).<br/><b>Atenção:</b> contribuição de MEI conta como "salário mínimo" para o cálculo. Então a aposentadoria por idade do MEI costuma ser baixa — próximo a 1 salário mínimo.',
            '<b>2. Aposentadoria por tempo de contribuição</b><br/>Extinta pela Reforma da Previdência (2019). Quem já tinha 35 anos (homem) ou 30 anos (mulher) de contribuição até 13/11/2019 tem direito. Para os demais, não existe mais.',
            '<b>3. Aposentadoria por pontos</b><br/>Soma de idade + tempo de contribuição. Em 2026, precisa de 99 pontos (homem) ou 89 pontos (mulher). Subindo 1 ponto por ano até chegar a 105 (homem) e 100 (mulher).<br/>Ex: homem de 60 anos com 39 anos de contribuição = 99 pontos. Pode se aposentar.',
            '<b>4. Aposentadoria especial</b><br/>Para atividades de risco. Entregador NÃO se enquadra — não é atividade de risco comprovado.',
            '<b>Como aumentar a aposentadoria?</b>',
            'O problema do MEI: a contribuição é só 5% do salário mínimo. Aposentadoria fica limitada a ~1 salário mínimo. Para aumentar, você precisa <b>complementar a contribuição</b>.',
            '<b>Opção 1: Contribuição facultativa</b><br/>Além do DAS, pague mais uma guia (GPS - Guia da Previdência Social). Código 1406 (facultativo mensal) — 20% do salário de contribuição. Ex: se você quer contribuir sobre R$ 2.000, paga 20% = R$ 400/mês extras. Em 30 anos, sua aposentadoria será sobre R$ 2.000 (não sobre salário mínimo).',
            '<b>Opção 2: Pró-labore</b><br/>Pegue pró-labore da sua empresa (você mesmo). Sobre o pró-labore, pague 11% de INSS. Ex: pró-labore de R$ 2.000, paga R$ 220/mês extras. Conta como contribuição sobre R$ 2.000.',
            '<b>Opção 3: Plano de previdência privada</b><br/>PGBL ou VGBL em uma seguradora (Itaú, Bradesco, Mapfre, etc.). Você escolhe quanto aportar. Rende juros compostos por décadas. <b>Ideal para complementar o INSS.</b>',
            '<b>Estratégia recomendada para entregador:</b>',
            '<b>1. Continue pagando DAS todo mês.</b> Garante 1 salário mínimo de aposentadoria + benefícios (auxílio-doença, salário-maternidade).',
            '<b>2. Faça contribuição facultativa (GPS 1406).</b> Sobre R$ 1.500-2.000/mês. Custa R$ 300-400/mês. Aumenta sua aposentadoria para 1,5-2 salários mínimos.',
            '<b>3. Comece um PGBL.</b> Aporte R$ 100-200/mês em um plano de previdência. Em 30 anos a 10% ao ano, terá R$ 200.000-400.000. Complementa o INSS.',
            '<b>4. Diversifique com investimentos.</b> Tesouro IPCA+, FIIs, ações. Constrói patrimônio que rende renda passiva na aposentadoria.',
            '<b>Cálculo de aposentadoria ideal:</b>',
            'Meta: renda de R$ 3.000/mês na aposentadoria (50 anos).',
            'Fontes:',
            '<b>•</b> INSS (DAS + facultativo sobre R$ 2.000): R$ 1.500/mês<br/><b>•</b> PGBL com R$ 200/mês por 30 anos: R$ 600/mês de renda<br/><b>•</b> Investimentos próprios (Tesouro IPCA+, FIIs): R$ 900/mês de renda',
            'Total: R$ 3.000/mês. <b>É possível</b> com planejamento de 30 anos.',
            '<b>Quando começar?</b><br/><b>Hoje.</b> Quanto mais cedo você começa, menos precisa aportar por mês. Começar aos 25 anos: R$ 200/mês. Começar aos 35: R$ 400/mês. Começar aos 45: R$ 800/mês. <b>Tempo é dinheiro — literalmente.</b>',
            '<b>Não confie só no INSS.</b> A previdência pública está em crise. Pode mudar. Pode reduzir. Complemente com privada e investimentos próprios para garantir renda na velhice.',
        ],
        callout='DAS garante 1 salário mínimo de aposentadoria. Para mais, faça contribuição facultativa (GPS 1406) sobre R$ 2.000. Complemente com PGBL (R$ 200/mês). Meta: R$ 3.000/mês de renda na aposentadoria.'
    ))
    
    story.extend(ch(
        'Cap. 23: Quando comprar uma segunda moto',
        'Análise de viabilidade',
        [
            'Comprar uma segunda moto é o primeiro passo para escalar o negócio de entrega. Mas quando vale a pena? Como saber se é o momento certo? Vamos analisar.',
            '<b>Sinais de que você está pronto para a segunda moto:</b>',
            '<b>1. Você está recusando corridas por falta de tempo</b><br/>Se mesmo trabalhando 10+ horas por dia você não consegue atender toda demanda, sinal de que precisa de ajuda. Uma segunda moto com outro entregador multiplicaria sua capacidade.',
            '<b>2. Seu faturamento está acima de R$ 6.000/mês consistente</b><br/>Acima disso, você está no limite do MEI. Está na hora de escalar. Uma segunda moto poderia levar seu faturamento para R$ 10.000-12.000/mês.',
            '<b>3. Você tem reserva de emergência completa (6 meses)</b><br/>Antes de investir em ativos do negócio, proteja-se. Sem reserva, qualquer problema com a segunda moto vira crise.',
            '<b>4. Você conhece alguém de confiança para dirigir</b><br/>Moto parada não gera dinheiro. Precisa de um entregador confiável (amigo, parente, funcionário) para dirigir. Sem pessoa certa, não compre.',
            '<b>5. Você tem tempo para gerenciar</b><br/>Segunda moto = mais trabalho administrativo. Repassar manutenção, dividir corridas, controlar faturamento de 2 motos. Precisa de tempo livre.',
            '<b>Cálculo de viabilidade:</b>',
            'Vamos supor: você compra uma moto usada de R$ 8.000. Contrata um entregador. Como funciona a divisão?',
            '<b>Modelo 1: Funcionário CLT</b><br/>Você paga salário + encargos. Salário: R$ 1.500/mês + 50% de encargos = R$ 2.250/mês de custo total. Receita esperada: R$ 4.000-5.000/mês. <b>Lucro com a 2a moto: R$ 1.750-2.750/mês.</b> Payback (retorno do investimento da moto): 4-5 meses.',
            'Mas CLT tem custos: 13o, férias, FGTS, multa de 40% se demitir. Custo anualizado: R$ 30.000+ (incluindo encargos).',
            '<b>Modelo 2: Parceiro autônomo (recomendado)</b><br/>Você cede a moto, ele faz as corridas. Vocês dividem o lucro: 50/50 ou 60/40 (a seu favor, já que a moto é sua). Receita esperada: R$ 4.000-5.000/mês. <b>Seu lucro: R$ 2.000-2.500/mês.</b> Payback: 3-4 meses.',
            'Vantagem do modelo parceiro: sem encargos trabalhistas, sem risco de processo, flexibilidade. Desvantagem: menos controle, parceiro pode sair quando quiser.',
            '<b>Modelo 3: Aluguel da moto</b><br/>Você aluga a moto por R$ 50-80/dia para outro entregador. Ele assume risco das corridas. Você recebe fixo. Receita: R$ 1.500-2.400/mês (30 dias × R$ 50-80). <b>Lucro: R$ 1.500-2.400/mês.</b> Payback: 4-5 meses.',
            'Vantagem: renda garantida, sem risco. Desvantagem: moto sofre mais desgaste (motorista não é dono, não cuida).',
            '<b>Comparativo dos 3 modelos:</b>',
            'Modelo | Custo mensal | Receita | Lucro | Risco<br/>CLT | R$ 2.250 | R$ 4.500 | R$ 2.250 | Alto<br/>Parceiro | R$ 0 | R$ 4.500 | R$ 2.250 (50%) | Médio<br/>Aluguel | R$ 0 | R$ 2.000 | R$ 2.000 | Baixo',
            '<b>Recomendado: Modelo parceiro.</b> Melhor equilíbrio entre lucro e risco.',
            '<b>Custos adicionais da 2a moto:</b>',
            '<b>•</b> Manutenção: R$ 200/mês (igual a primeira)<br/><b>•</b> Seguro: R$ 80/mês<br/><b>•</b> IPVA: R$ 50/mês<br/><b>•</b> Depreciação: R$ 200/mês<br/><b>•</b> Equipamentos (mochila, capacete para o parceiro): R$ 50/mês amortizado<br/><b>Total: R$ 580/mês</b>',
            '<b>Fluxo de caixa mensal (modelo parceiro 50/50):</b>',
            'Receita bruta (2a moto): R$ 4.500<br/>(-) Custo de manutenção: R$ 580<br/>(=) Lucro operacional: R$ 3.920<br/>(-) Parceiro (50%): R$ 1.960<br/><b>(=) Seu lucro líquido: R$ 1.960/mês</b>',
            'Payback do investimento: R$ 8.000 ÷ R$ 1.960/mês = <b>4 meses</b>. Excelente retorno.',
            '<b>Riscos a considerar:</b>',
            '<b>1. Parceiro pode bater a moto.</b> Tenha seguro. Exija carteira de moto com mais de 2 anos de experiência.<br/><b>2. Parceiro pode sumir com a moto.</b> Tenha contrato escrito. Anote RG, CPF, comprovante de residência.<br/><b>3. Parceiro pode não trabalhar o suficiente.</b> Estabeleça meta mínima: "Você precisa faturar R$ 3.000/mês para manter a moto."<br/><b>4. Moto pode quebrar.</b> Reserve 10% do lucro para manutenção da 2a moto.',
            '<b>Contrato de parceria (modelo simples):</b>',
            'Faça um contrato de "cessão de uso" da moto. Cláusulas principais:<br/>• Descrição da moto (marca, modelo, placa)<br/>• Período de cessão (ex: 12 meses)<br/>• Valor da divisão (50/50 do faturamento)<br/>• Responsabilidade por multas (parceiro paga as dele)<br/>• Responsabilidade por manutenção preventiva (você paga) e corretiva por mau uso (parceiro paga)<br/>• Rescisão (qualquer parte pode rescindir com 30 dias de aviso)<br/>• Devolução da moto (no estado em que foi recebida, considerando desgaste normal)',
            'Contrato não precisa ser registrado em cartório. Basta assinado pelas duas partes com duas testemunhas. Mas registre no cartório de títulos para mais segurança (custa R$ 50-100).',
            '<b>Plano para expandir:</b>',
            'Após 6-12 meses com a 2a moto funcionando bem, considere a 3a. Em 2-3 anos, você pode ter 4-5 motos e se tornar uma pequena frota. Aí sim, talvez seja hora de migrar de MEI para ME e contratar contador.',
        ],
        callout='Compre a 2a moto quando: fatura R$ 6.000+/mês, tem reserva completa, conhece pessoa de confiança. Modelo parceiro 50/50: lucro de R$ 1.960/mês, payback de 4 meses. Tenha contrato escrito.'
    ))
    
    story.extend(ch(
        'Cap. 24: Contratar outro entregador — quando vale',
        'Primeiro passo para frota',
        [
            'Contratar um entregador como funcionário é diferente de ceder a moto para um parceiro. É assumir mais responsabilidades — mas também ter mais controle. Vamos ver quando vale a pena e como fazer.',
            '<b>Diferença entre parceiro e funcionário:</b>',
            '<b>Parceiro:</b> autônomo, recebe divisão do lucro, não tem vínculo empregatício. Você não paga encargos. Ele decide quando trabalhar.<br/><b>Funcionário CLT:</b> tem carteira assinada, salário fixo, você paga 50% de encargos em cima. Ele tem horário, férias, 13o.',
            'Para o entregador iniciante em escala, <b>parceiro é melhor</b> (vimos no capítulo 23). Mas quando você tem 3+ motos, contratar funcionário pode fazer sentido para ter equipe estável.',
            '<b>Quando vale contratar CLT?</b>',
            '<b>1. Quando você tem 3+ motos</b><br/>Com 1-2 motos, parceiro resolve. Com 3+, precisa de gestão. Funcionário CLT traz estabilidade e comprometimento.',
            '<b>2. Quando você quer construir uma empresa</b><br/>CLT é o caminho para construir "frota MeuCorre" como negócio formal. Permite acesso a crédito empresarial, contratos com empresas, etc.',
            '<b>3. Quando o faturamento mensal supera R$ 15.000</b><br/>Aqui você já saiu do MEI. Precisa ser ME. Funcionário CLT faz parte do negócio formal.',
            '<b>Custos de um funcionário CLT entregador:</b>',
            '<b>Salário:</b> R$ 1.500-2.500 (depende da cidade)<br/><b>Encargos sociais (50%):</b> R$ 750-1.250<br/>• INSS patronal (20%): R$ 300-500<br/>• FGTS (8%): R$ 120-200<br/>• SAT/RAT (1-3%): R$ 15-75<br/>• Terceiros (5,8%): R$ 87-145<br/>• 13o proporcional (8,33%): R$ 125-208<br/>• Férias + 1/3 (11,11%): R$ 167-278<br/><b>Custo total mensal: R$ 2.250-3.750</b>',
            '<b>Custos anuais adicionais:</b>',
            '<b>•</b> 13o completo (1 salário extra): R$ 1.500-2.500<br/><b>•</b> Férias completo (1 salário + 1/3): R$ 2.000-3.333<br/><b>•</b> Vale-transporte (se aplicável): R$ 200-300/mês<br/><b>•</b> Vale-refeição (opcional): R$ 300-500/mês',
            'Total anualizado: R$ 35.000-50.000 por funcionário. Parece muito? É. Por isso só vale a partir de 3+ motos e faturamento alto.',
            '<b>Como calcular se vale a pena:</b>',
            'Vamos supor: você tem 4 motos. 3 com parceiros (lucro de R$ 1.500/mês cada = R$ 4.500/mês). 1 moto para um funcionário CLT que você gerencia diretamente.',
            'Receita esperada da moto do funcionário: R$ 4.500/mês (igual às outras).<br/>Custo do funcionário: R$ 2.750/mês (incluindo todos os encargos).<br/>Custo da moto (manutenção, etc.): R$ 580/mês.<br/><b>Lucro com a moto do funcionário: R$ 4.500 - R$ 2.750 - R$ 580 = R$ 1.170/mês.</b>',
            'Comparado com parceiro (R$ 1.960/mês), funcionário dá menos lucro. <b>Mas:</b> você tem mais controle, comprometimento, e está construindo uma empresa.',
            '<b>Vantagens do funcionário CLT:</b>',
            '<b>•</b> Controle de horário e produtividade<br/><b>•</b> Comprometimento (precisa do emprego)<br/><b>•</b> Possibilidade de treinamento<br/><b>•</b> Construção de equipe<br/><b>•</b> Imagem profissional (empresa com equipe)',
            '<b>Desvantagens:</b>',
            '<b>•</b> Mais custos (encargos)<br/><b>•</b> Risco trabalhista (processos)<br/><b>•</b> Burocracia (folha, INSS, FGTS)<br/><b>•</b> Necessidade de contador (R$ 200-400/mês)',
            '<b>Como contratar CLT (passo a passo):</b>',
            '<b>1.</b> Migre de MEI para ME (Microempresa). Custo: R$ 200-500 para abertura, R$ 100-200/mês de contador.<br/><b>2.</b> Cadastre-se no eSocial (sistema do governo para empregadores).<br/><b>3.</b> Faça contrato de trabalho (modelo pronto na internet).<br/><b>4.</b> Assine a carteira do funcionário (data de admissão, cargo, salário).<br/><b>5.</b> Comece a pagar folha mensal (com encargos).<br/><b>6.</b> Recolha FGTS, INSS, etc. Mensalmente.',
            'Sem contador, é muito difícil. <b>Contrate um.</b> Custa R$ 200-400/mês mas evita multas de R$ 1.000+.',
            '<b>Alternativas ao CLT:</b>',
            'Se CLT está caro, considere:',
            '<b>•</b> Estagiário (precisa ser estudante). Custo: bolsa-auxílio R$ 500-1.000 + seguro. Bom para aprendizes.<br/><b>•</b> Menor aprendiz (14-18 anos). Custo: salário mínimo, sem encargos completos. Bom para formar equipe jovem.<br/><b>•</b> PJ (pessoa jurídica). Funcionário vira MEI e você contrata o serviço. Sem encargos, mas risco de vínculo empregatício (multa alta se comprovado).',
            'Para entregador, <b>comece com parceiro</b>. Só migre para CLT quando tiver 3+ motos e faturamento alto. CLT é o caminho da empresa — não do entregador individual.',
        ],
        callout='Funcionário CLT só vale com 3+ motos e faturamento R$ 15.000+/mês. Antes disso, use parceiro (50/50). Para CLT: migre para ME, contrate contador, eSocial. Custo: R$ 2.750/mês.'
    ))
    
    story.extend(ch(
        'Cap. 25: Plano de 90 dias para estabilizar',
        'Cronograma de execução',
        [
            'Você leu sobre gestão financeira, custos, otimização, IR, reserva, investimentos, escala. Mas ler não muda nada — só execução muda. Por isso, vamos transformar tudo em um plano de 90 dias. Pequeno, específico, possível.',
            '<b>Mês 1 (Dias 1-30): Fundação</b>',
            'Objetivo: montar a estrutura básica de controle financeiro.',
            '<b>Semana 1:</b><br/>• Dia 1: Abra conta digital gratuita (Nubank, Inter, PagBank) — 15 min<br/>• Dia 2: Vire MEI no portaldoempreendedor.gov.br — 30 min<br/>• Dia 3: Baixe o MeuCorre e ative captura automática — 5 min<br/>• Dia 4: Calcule seu custo por km (combustível + manutenção + depreciação) — 1 hora<br/>• Dia 5: Defina seus limites mínimos (R$/km e R$/hora) — 30 min<br/>• Dia 6-7: Configure apps de entrega para pagar na nova conta PJ',
            '<b>Semana 2:</b><br/>• Dia 8-14: Lance TODAS as despesas por 7 dias. Use o MeuCorre. Veja o total no fim da semana — provavelmente vai se chocar.<br/>• Comece a registrar cada corrida: distância, valor, R$/km. Compare com seus limites.',
            '<b>Semana 3:</b><br/>• Dia 15-21: Recuse corridas abaixo dos seus limites. Veja o que acontece.<br/>• Identifique suas zonas quentes (onde pega mais corridas). Fique mais nessas zonas.<br/>• Comece a mapear horários de pico pessoais.',
            '<b>Semana 4:</b><br/>• Dia 22-28: Separe 5% de tudo que entrou para reserva. Transfira para conta separada (Tesouro Selic ou conta que rende).<br/>• Faça a primeira revisão completa: o que funcionou, o que não funcionou, o que ajustar.<br/>• Pague o primeiro DAS do MEI (R$ 65).',
            '<b>Resultado esperado do Mês 1:</b>',
            '• Conta PJ aberta e funcionando<br/>• MEI ativo<br/>• App capturando tudo automático<br/>• Custos conhecidos<br/>• Limites definidos<br/>• Reserva iniciada (R$ 100-200)<br/>• Consciência real de quanto ganha e gasta',
            '<b>Mês 2 (Dias 31-60): Otimização</b>',
            'Objetivo: aumentar lucro trabalhando o mesmo (ou menos).',
            '<b>Semana 5-6:</b><br/>• Ajuste seus horários: foque nos picos (11h-14h e 19h-23h). Reduza horas mortas (14h-17h).<br/>• Anote R$/hora por faixa de horário. Compare.<br/>• Teste multi-app (iFood + 99Food + Rappi simultâneo).',
            '<b>Semana 7-8:</b><br/>• Aplique as otimizações de combustível (cap. 7): calibre pneus, troque óleo, abasteça nos postos mais baratos.<br/>• Faça manutenção preventiva completa (R$ 130).<br/>• Comece a reserva de depreciação (R$ 0,13/km rodado).<br/>• Participe de todas as campanhas e bônus dos apps.',
            '<b>Resultado esperado do Mês 2:</b>',
            '• R$/hora aumentou 20-30%<br/>• Trabalha 1-2 horas a menos por dia<br/>• Reserva total: R$ 400-600<br/>• Reserva de depreciação: R$ 200-300<br/>• Manutenção preventiva em dia<br/>• Economia de gasolina: R$ 100-150/mês',
            '<b>Mês 3 (Dias 61-90): Crescimento</b>',
            'Objetivo: investir excedente e planejar próximos passos.',
            '<b>Semana 9-10:</b><br/>• Verifique se a reserva de emergência já tem 1 mês de despesas (R$ 2.500-5.000). Se sim, comece a investir 10% do lucro em Tesouro Selic.<br/>• Faça a declaração do DASN-SIMEI (se for época). Use o relatório do MeuCorre.<br/>• Avalie se vale a pena emitir NFS-e para entrega direta.',
            '<b>Semana 11-12:</b><br/>• Analise dados de 90 dias: faturamento, lucro, R$/km, R$/hora por app, zonas quentes, horários de pico.<br/>• Defina metas para os próximos 90 dias: faturamento, lucro, reserva, investimentos.<br/>• Avalie se está na hora de considerar 2a moto (cap. 23) ou não.<br/>• Continue reservando 5% para reserva + 10% para investimentos.',
            '<b>Resultado esperado do Mês 3:</b>',
            '• Reserva total: R$ 800-1.200<br/>• Investimentos iniciados: R$ 200-400<br/>• DASN-SIMEI declarada<br/>• Plano para próximos 90 dias definido<br/>• Visão clara de onde está e para onde vai',
            '<b>Resumo de 90 dias:</b>',
            'Antes: entregador sem controle, faturando R$ 3.000, lucrando desconhecido, sem reserva, sem MEI, sem perspectiva.',
            'Depois: entregador organizado, faturando R$ 3.500-4.000 (15-30% mais), lucrando R$ 1.800-2.200 claros, com R$ 800-1.200 de reserva, R$ 200-400 investidos, MEI em dia, IR em dia, plano para os próximos 90 dias.',
            '<b>Não são números mágicos. São consequência de aplicar boas práticas.</b>',
            'Cada passo é pequeno. Cada dia é uma ação. Em 90 dias, você terá mudado mais do que em 5 anos de "vou começar a controlar".',
            '<b>Compromisso:</b> comece hoje. Não amanhã, não segunda, não "mês que vem". Hoje. Dia 1. Abra a conta. Dia 2. Vire MEI. Dia 3. Baixe o MeuCorre. Em 7 dias, você já terá mudado mais do que em 1 ano de intenção.',
        ],
        callout='Plano de 90 dias: 1 ação por dia. Mês 1 = estrutura. Mês 2 = otimização. Mês 3 = crescimento. Resultado: lucro +30%, reserva R$ 1.000+, investimentos iniciados. Comece HOJE.'
    ))
    
    # Conclusão
    story.extend(ch(
        'Sobre o MeuCorre',
        'O app que automatiza tudo',
        [
            'Você chegou ao fim deste e-book. Leu 60 páginas sobre gestão financeira para entregadores. Mas o conhecimento só vale se virar ação. E ação só é sustentável se for fácil. É aqui que o MeuCorre entra.',
            'O MeuCorre é um app gratuito, criado por um entregador para entregadores. Não é teoria — é prática. Cada recurso foi pensado para resolver um problema real que você acaba de ler neste livro.',
            '<b>O que o MeuCorre faz por você:</b>',
            '<b>1. Captura automática de corridas</b><br/>Quando o app de entrega (iFood, 99Food, Rappi, Lalamove) envia "Corrida concluída R$ 18,50", o MeuCorre captura automaticamente. Você não abre nada, não digita nada, não para a moto. Tudo registrado.',
            '<b>2. Cálculo de lucro líquido em tempo real</b><br/>Você cadastra sua moto (valor, km atual), preço da gasolina, média de km/L. O app calcula seu custo por km e desconta automaticamente. Mostra o lucro real de cada corrida — não o faturamento ilusório.',
            '<b>3. Despesas em 3 toques</b><br/>Botão grande na tela inicial. Categoria pré-definida (gasolina, alimentação, manutenção, etc.). Valor. Pronto. 5 segundos por despesa. Sem planilha, sem caderno, sem sofrimento.',
            '<b>4. Mapa de zonas quentes</b><br/>O app mostra no mapa onde você pegou mais corridas, em quais horários. Em 2 semanas de uso, você terá o "mapa do tesouro" da sua cidade personalizado.',
            '<b>5. Análise de R$/km e R$/hora por app</b><br/>Sabe exatamente qual app paga melhor, em quais horários, em quais regiões. Dados para decidir onde focar.',
            '<b>6. Reserva automática</b><br/>Separa 5% de tudo que entra para reserva. 10% para depreciação da moto. Tudo automático. Você não precisa lembrar.',
            '<b>7. Relatórios para IR</b><br/>Gera o relatório anual pronto: faturamento bruto, despesas por categoria, DAS pago, depreciação calculada. Copia e cola na declaração. Sem stress, sem erro.',
            '<b>8. Lembretes inteligentes</b><br/>Avisa quando é hora de pagar o DAS, quando é hora de declarar a DASN-SIMEI, quando é hora de fazer manutenção preventiva (baseado no hodômetro).',
            '<b>9. Tudo offline, dados no celular</b><br/>O app funciona sem internet (você pode usar em garagem, subsolo, onde for). Suas informações ficam no seu celular — ninguém mais tem acesso. Privacidade total.',
            '<b>10. 100% gratuito</b><br/>Não pede cartão de crédito, não tem versão "premium". Tudo que descrevemos acima é grátis. Para sempre.',
            'Além do app, o MeuCorre oferece:',
            '<b>•</b> Blog com dicas práticas (meucorre.vercel.app/blog)<br/><b>•</b> Canal no Telegram com avisos e novidades<br/><b>•</b> Grupo no WhatsApp para suporte e networking entre entregadores<br/><b>•</b> E-books como este, com conteúdo prático e aplicável<br/><b>•</b> Curso premium para quem quer levar o negócio a outro nível (15 módulos, 150 capítulos)',
            'Baixe agora em <b>meucorre.vercel.app</b>. Leva 30 segundos. Não pede dados sensíveis, não pede cartão. Apenas funciona.',
            '<b>Boa entrega, bom lucro, e até a próxima!</b>',
            '<i>— Equipe MeuCorre</i>',
        ],
        callout='Baixe grátis em meucorre.vercel.app. Captura automática, cálculo de lucro real, mapa de zonas quentes, relatórios para IR. Tudo automático. Tudo gratuito.'
    ))
    
    doc.build(story)
    print(f"PDF gerado: {output}")
    print(f"Tamanho: {os.path.getsize(output) / 1024:.1f} KB")

if __name__ == '__main__':
    build()

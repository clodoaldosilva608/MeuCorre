#!/usr/bin/env python3
"""
Gera o e-book '10 Erros que Entregadores Cometem' (20+ páginas)
Formato: PDF profissional com capa, índice e capítulos formatados.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, ListFlowable, ListItem
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus.flowables import HRFlowable
import os

# ===== Fontes =====
try:
    pdfmetrics.registerFont(TTFont('Body', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
    pdfmetrics.registerFont(TTFont('Body-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
    pdfmetrics.registerFont(TTFont('Body-Italic', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf'))
    BODY = 'Body'
    BOLD = 'Body-Bold'
    ITALIC = 'Body-Italic'
except:
    BODY = 'Helvetica'
    BOLD = 'Helvetica-Bold'
    ITALIC = 'Helvetica-Oblique'

# ===== Cores MeuCorre =====
EMERALD = HexColor('#10b981')
DARK = HexColor('#0f172a')
TEXT = HexColor('#1e293b')
MUTED = HexColor('#64748b')
BG_LIGHT = HexColor('#f8fafc')
BG_ERROR = HexColor('#fef3c7')
BG_SUCCESS = HexColor('#dcfce7')
BORDER = HexColor('#e2e8f0')

# ===== Estilos =====
styles = getSampleStyleSheet()

style_cover_title = ParagraphStyle('CoverTitle', parent=styles['Title'],
    fontName=BOLD, fontSize=32, textColor=white, alignment=TA_CENTER, spaceAfter=10, leading=38)
style_cover_sub = ParagraphStyle('CoverSub', parent=styles['Normal'],
    fontName=BODY, fontSize=14, textColor=HexColor('#10b981'), alignment=TA_CENTER, spaceAfter=20)
style_cover_author = ParagraphStyle('CoverAuthor', parent=styles['Normal'],
    fontName=BODY, fontSize=11, textColor=HexColor('#94a3b8'), alignment=TA_CENTER)

style_h1 = ParagraphStyle('H1', parent=styles['Heading1'],
    fontName=BOLD, fontSize=22, textColor=EMERALD, spaceBefore=20, spaceAfter=12, leading=28)
style_h2 = ParagraphStyle('H2', parent=styles['Heading2'],
    fontName=BOLD, fontSize=16, textColor=DARK, spaceBefore=16, spaceAfter=8, leading=20)
style_h3 = ParagraphStyle('H3', parent=styles['Heading3'],
    fontName=BOLD, fontSize=13, textColor=EMERALD, spaceBefore=12, spaceAfter=6, leading=16)

style_body = ParagraphStyle('Body', parent=styles['Normal'],
    fontName=BODY, fontSize=11, textColor=TEXT, alignment=TA_JUSTIFY, leading=16, spaceAfter=8)
style_quote = ParagraphStyle('Quote', parent=styles['Normal'],
    fontName=ITALIC, fontSize=11, textColor=MUTED, alignment=TA_LEFT, leading=15,
    leftIndent=20, rightIndent=20, spaceBefore=8, spaceAfter=8,
    borderColor=EMERALD, borderWidth=0, borderPadding=0)
style_callout = ParagraphStyle('Callout', parent=styles['Normal'],
    fontName=BODY, fontSize=10, textColor=DARK, alignment=TA_LEFT, leading=14,
    backColor=BG_LIGHT, borderColor=EMERALD, borderWidth=0, borderPadding=8,
    leftIndent=0, rightIndent=0, spaceBefore=8, spaceAfter=8)
style_toc = ParagraphStyle('TOC', parent=styles['Normal'],
    fontName=BODY, fontSize=11, textColor=TEXT, alignment=TA_LEFT, leading=18, leftIndent=10)

def cover_page():
    """Página de capa."""
    flow = []
    # Espaço superior
    flow.append(Spacer(1, 6*cm))
    # Logo/símbolo
    flow.append(Paragraph('<font color="#10b981" size="50">⚡</font>', ParagraphStyle('Logo', alignment=TA_CENTER, fontSize=50)))
    flow.append(Spacer(1, 1*cm))
    # Título
    flow.append(Paragraph('10 Erros que<br/>Entregadores Cometem', style_cover_title))
    flow.append(Spacer(1, 0.5*cm))
    flow.append(Paragraph('E como evitar cada um deles', style_cover_sub))
    flow.append(Spacer(1, 3*cm))
    flow.append(HRFlowable(width="40%", thickness=2, color=EMERALD, hAlign='CENTER'))
    flow.append(Spacer(1, 0.5*cm))
    flow.append(Paragraph('MeuCorre', ParagraphStyle('Brand', fontName=BOLD, fontSize=14, textColor=white, alignment=TA_CENTER)))
    flow.append(Paragraph('Guia prático para entregadores de aplicativo', style_cover_author))
    flow.append(Spacer(1, 0.3*cm))
    flow.append(Paragraph('Edição 2026', style_cover_author))
    flow.append(PageBreak())
    return flow

def toc_page():
    """Página de índice."""
    flow = []
    flow.append(Paragraph('Sumário', style_h1))
    flow.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    flow.append(Spacer(1, 0.5*cm))
    
    chapters = [
        ('Introdução', 'Por que este e-book existe'),
        ('Erro 1: Não saber calcular o lucro real', 'A armadilha do "ganhei bem hoje"'),
        ('Erro 2: Ignorar a depreciação da moto', 'O custo invisível que quebra o orçamento'),
        ('Erro 3: Misturar dinheiro pessoal e de entrega', 'O caos financeiro começa aqui'),
        ('Erro 4: Não registrar despesas pequenas', 'R$ 5 por dia = R$ 1.800 por ano'),
        ('Erro 5: Trabalhar sem reserva de emergência', 'Quando a moto quebra, o lucro acaba'),
        ('Erro 6: Aceitar toda corrida sem analisar', 'Nem todo km vale a pena'),
        ('Erro 7: Não otimizar rotas e horários', 'Tempo perdido é dinheiro perdido'),
        ('Erro 8: Ignorar impostos e MEI', 'A Receita não esquece'),
        ('Erro 9: Não investir em melhorias', 'Moto parada, dinheiro parado'),
        ('Erro 10: Desistir do controle financeiro', 'O erro que mantém todos os outros'),
        ('Conclusão: Seu plano de ação', 'Próximos 7 dias para mudar tudo'),
        ('Sobre o MeuCorre', 'O app que automatiza tudo isso'),
    ]
    
    for i, (title, sub) in enumerate(chapters):
        flow.append(Paragraph(f'<b>{title}</b>', style_toc))
        flow.append(Paragraph(f'<font color="#64748b" size="9">    {sub}</font>', style_toc))
        flow.append(Spacer(1, 4))
    
    flow.append(PageBreak())
    return flow

def chapter(title, subtitle, content_paragraphs, callout=None):
    """Cria um capítulo completo."""
    flow = []
    flow.append(Paragraph(title, style_h1))
    flow.append(Paragraph(subtitle, style_h3))
    flow.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    flow.append(Spacer(1, 0.3*cm))
    
    for p in content_paragraphs:
        flow.append(Paragraph(p, style_body))
    
    if callout:
        flow.append(Spacer(1, 0.2*cm))
        flow.append(Paragraph(f'<b>💡 {callout}</b>', style_callout))
    
    flow.append(PageBreak())
    return flow

# ===== CONTEÚDO DO E-BOOK =====

def build_ebook():
    output = '/home/z/my-project/download/EBOOK-10-ERROS-ENTREGADORES.pdf'
    
    doc = SimpleDocTemplate(output, pagesize=A4,
        leftMargin=2.2*cm, rightMargin=2.2*cm,
        topMargin=2.2*cm, bottomMargin=2.2*cm,
        title='10 Erros que Entregadores Cometem',
        author='MeuCorre',
        subject='Guia prático para entregadores de aplicativo')
    
    story = []
    
    # Capa (página 1)
    story.extend(cover_page())
    
    # Índice (página 2)
    story.extend(toc_page())
    
    # Introdução (página 3)
    story.extend(chapter(
        'Introdução',
        'Por que este e-book existe',
        [
            'Você trabalha o dia inteiro na moto. Acorda cedo, enfrenta trânsito, chuva, sol, clientes que não respondem, restaurantes que atrasam. No fim do dia, olha o saldo do app e pensa: "hoje foi bom, ganhei R$ 200". Mas será que ganhou mesmo?',
            'A maioria dos entregadores que conversamos ao longo dos últimos meses não sabe responder a uma pergunta simples: <b>qual é o seu lucro líquido por quilômetro rodado?</b> Eles sabem quanto "entrou", mas não sabem quanto realmente sobrou depois de descontar combustível, manutenção, depreciação da moto, alimentação, pedágio, IPVA, seguro e o tempo gasto parado esperando corrida.',
            'O resultado? Trabalham 10, 12 horas por dia, seis dias por semana, e no fim do mês o saldo no banco não cresce. Quando a moto quebra — e ela sempre quebra — não têm reserva. Quando chega o IR, não sabem o que declarar. Quando pensam em comprar uma moto nova, descobrem que a atual vale menos da metade do que imaginavam.',
            'Este e-book não é teoria. É o conjunto dos <b>10 erros mais comuns</b> que vimos repetidamente em mais de 2.800 entregadores que já usaram o MeuCorre. Cada erro tem uma solução prática — algo que você pode começar a fazer hoje, sem precisar de planilhas complexas ou conhecimento de finanças.',
            'Se você cometer um só desses erros, está perdendo dinheiro todos os dias. Se cometer vários — o que é mais provável — está perdendo centenas de reais por mês sem perceber. Vamos mudar isso nas próximas páginas.',
        ],
        callout='Tempo de leitura: 25 minutos. Tempo de aplicar: 7 dias. Impacto no seu bolso: para sempre.'
    ))
    
    # Erro 1
    story.extend(chapter(
        'Erro 1: Não saber calcular o lucro real',
        'A armadilha do "ganhei bem hoje"',
        [
            'O primeiro e mais grave erro é confundir <b>faturamento</b> com <b>lucro</b>. Faturamento é o que o app mostra no final do dia: "você ganhou R$ 187,50". Lucro é o que realmente sobra no seu bolso depois de pagar todos os custos para gerar aquele R$ 187,50.',
            'Vamos fazer as contas. Imagine um dia típico de entrega: você rodou 120 km, ganhou R$ 187,50, trabalhou 9 horas. Parece bom, certo? Mas vamos descontar os custos reais:',
            '<b>Combustível:</b> 120 km a R$ 0,28/km (média de moto 125cc a R$ 6,50/L, fazendo 35 km/L) = R$ 33,60.<br/><b>Manutenção programada:</b> óleo, pneu, corrente, pastilha — média R$ 0,08/km = R$ 9,60.<br/><b>Depreciação da moto:</b> R$ 0,12/km (perda de valor por uso) = R$ 14,40.<br/><b>Alimentação em rua:</b> R$ 25,00 (almoço + lanches).<br/><b>Desgaste de equipamento:</b> mochila, capacete, luva — R$ 0,02/km = R$ 2,40.<br/><b>Total de custos: R$ 85,00</b>',
            'Lucro real = R$ 187,50 - R$ 85,00 = <b>R$ 102,50</b>. Não é R$ 187,50. É pouco mais da metade.',
            'Agora calcule o lucro por hora: R$ 102,50 ÷ 9 horas = <b>R$ 11,39/hora</b>. E por quilômetro: R$ 102,50 ÷ 120 km = <b>R$ 0,85/km</b>. Esses são os números que importam. Não "quanto entrei", mas "quanto sobrou por hora e por km".',
            'Por que isso é um erro tão grave? Porque sem saber o lucro real, você não consegue tomar boas decisões. Não sabe se vale a pena pegar aquela corrida longa para o aeroporto. Não sabe se vale a pena trabalhar domingo. Não sabe se um app está pagando melhor que o outro. Você está dirigindo no escuro.',
        ],
        callout='Solução: anote TODOS os custos por 7 dias. Some tudo. Divida pelo km rodado. Esse é o seu custo por km. Subtraia do que o app paga por km. A diferença é o seu lucro real.'
    ))
    
    # Erro 2
    story.extend(chapter(
        'Erro 2: Ignorar a depreciação da moto',
        'O custo invisível que quebra o orçamento',
        [
            'Sua moto vale menos hoje do que ontem. E amanhã valerá menos ainda. Cada quilômetro rodado desgasta o motor, a suspensão, os pneus, o escape, a pintura. Esse desgaste é um custo real — mas é invisível porque você não paga ele todo dia. Paga de uma vez, quando precisa trocar a moto.',
            'Vamos colocar números. Uma moto 125cc nova custa cerca de R$ 14.000. Após 3 anos de uso intenso de entrega (cerca de 60.000 km), ela vale R$ 6.000 no mercado usado. Você perdeu R$ 8.000 em 3 anos — ou <b>R$ 0,13 por quilômetro rodado</b>.',
            'Isso significa que para cada corrida de 10 km, você "pagou" R$ 1,30 só de depreciação. Em um dia de 120 km, são R$ 15,60. Em um mês de 26 dias trabalhados, são <b>R$ 405 por mês</b> só de perda de valor da moto. Em um ano: <b>R$ 4.860</b>.',
            'A maioria dos entregadores ignora isso porque "a moto já está paga". Mas não está. Você está financiando, sem saber, uma perda silenciosa de quase R$ 5.000 por ano. Quando chega a hora de trocar a moto, descobre que não tem dinheiro — porque gastou o "lucro" sem reservar a depreciação.',
            'Como resolver? <b>Reserve R$ 0,13 por km rodado em uma conta separada.</b> Se você roda 120 km/dia, são R$ 15,60/dia ou R$ 405/mês. Esse dinheiro é intocável — é o caixa para a próxima moto. Quando chegar a hora de trocar, você terá os R$ 4.860/ano guardados.',
            'O MeuCorre faz esse cálculo automaticamente: você cadastra o valor da moto, a quilometragem, e o app separa a depreciação todo dia. Você vê o "lucro real" já descontado, sem precisar pensar nisso.',
        ],
        callout='Regra de ouro: reserve R$ 0,13/km rodado para a próxima moto. Em 3 anos, você terá ~R$ 14.000 guardados — o suficiente para trocar sem financiamento.'
    ))
    
    # Erro 3
    story.extend(chapter(
        'Erro 3: Misturar dinheiro pessoal e de entrega',
        'O caos financeiro começa aqui',
        [
            'O entregador médio usa a mesma conta bancária para receber pagamentos do app, pagar a gasolina, comprar comida, pagar o aluguel e o plano de celular. O resultado? Ele não sabe, em nenhum momento, quanto a entrega realmente gerou. Quando precisa pagar o IR ou comprovar renda, está perdido.',
            'Esse erro é mais grave do que parece. Sem separar o dinheiro do "negócio entrega" do dinheiro "pessoal", você não consegue:',
            '<b>•</b> Saber se está lucrando ou só sobrevivendo<br/><b>•</b> Calcular corretamente o IR (deduções só valem se forem do negócio)<br/><b>•</b> Comprovar renda para financiamento ou cartão<br/><b>•</b> Saber quando pode "se pagar" um salário<br/><b>•</b> Identificar se um mês foi bom ou ruim de verdade',
            'A solução é simples e barata. <b>Abra uma conta digital gratuita apenas para a entrega.</b> Pode ser Nubank, Inter, PagBank, Mercado Pago — qualquer uma que não cobre mensalidade. Use essa conta para:',
            '<b>Receber:</b> pagamentos dos apps de entrega.<br/><b>Pagar:</b> gasolina, óleo, pneu, manutenção, alimentação em rua, pedágio.<br/><b>Transferir para conta pessoal:</b> o "salário" que você se paga semanalmente.',
            'A regra é: <b>todo dinheiro que entra pela entrega fica na conta do negócio</b>. Toda despesa relacionada à entrega sai da conta do negócio. Uma vez por semana, você calcula o lucro (entrou - saiu) e transfere 50% para sua conta pessoal como "salário". Os outros 50% ficam na conta do negócio para reserva, manutenção e investir em melhorias.',
            'Esse simples hábito de separar as contas muda tudo. Em 30 dias, você saberá exatamente quanto a entrega está gerando de lucro real. Em 90 dias, terá uma reserva formando sozinha. Em 1 ano, terá histórico suficiente para declarar IR corretamente, comprovar renda e tomar decisões estratégicas.',
        ],
        callout='Abra hoje uma conta digital gratuita só para entrega. Receba tudo nela, pague despesas de entrega nela. Transfira seu "salário" semanalmente. Mudança imediata no controle.'
    ))
    
    # Erro 4
    story.extend(chapter(
        'Erro 4: Não registrar despesas pequenas',
        'R$ 5 por dia = R$ 1.800 por ano',
        [
            'O entregador anota quando gasta R$ 50 de gasolina. Mas não anota o pastel de R$ 8, o café de R$ 5, o pedágio de R$ 3,50, a garrafa de água de R$ 4, o carregador de celular de R$ 25 que comprou no camelô. "Coisa pequena", pensa. O problema? Essas pequenas despesas somam mais do que as grandes.',
            'Vamos fazer as contas reais de um entregador médio em um dia de trabalho:',
            '<b>Café da manhã na rua:</b> R$ 7<br/><b>Almoço (marmita + refrigerante):</b> R$ 18<br/><b>2 cafés durante o dia:</b> R$ 10<br/><b>Água:</b> R$ 4<br/><b>Pastel/coxinha no fim do dia:</b> R$ 8<br/><b>Pedágio:</b> R$ 3,50<br/><b>Estacionamento em local específico:</b> R$ 5<br/><b>Total diário de "pequenas despesas": R$ 55,50</b>',
            'Em um mês de 26 dias trabalhados: <b>R$ 1.443</b>. Em um ano: <b>R$ 17.316</b>. Isso é mais do que muitos entregadores lucram em 4 meses de trabalho. E está sendo gasto sem registro, sem controle, sem otimização.',
            'Quando você não registra essas despesas, perde duas coisas. Primeiro, <b>não sabe se o negócio está dando lucra</b> — porque o "lucro" que vê no app não inclui esses R$ 55/dia. Segundo, <b>perde dedução no IR</b> — alimentação em dia de trabalho é dedutível para autônomo, mas só se você tiver comprovante e registro.',
            'A solução é usar o app MeuCorre, que tem um botão "lançar despesa" em 3 toques. Toda vez que gastar R$ 1 ou mais com a entrega, lance. Não precisa de nota fiscal para despesas abaixo de R$ 50 — basta o valor, a categoria e uma observação. O app soma tudo automaticamente e mostra o lucro real.',
            'Se você fizer isso por 30 dias, vai se surpreender. Provavelmente vai descobrir que gasta R$ 200-300 a mais do que imaginava. E vai poder cortar o que não agrega — talvez aquele café duplo que você nem precisa, ou o refrigerante que pode ser água de casa.',
        ],
        callout='Cada R$ 5 não registrado = R$ 130/mês perdido do seu controle. Baixe o MeuCorre, lance TODA despesa por 7 dias. Você vai se chocar com o total.'
    ))
    
    # Erro 5
    story.extend(chapter(
        'Erro 5: Trabalhar sem reserva de emergência',
        'Quando a moto quebra, o lucro acaba',
        [
            'Sua moto vai quebrar. Não é "se", é "quando". Pneu fura, motor trava, correia arrebenta, bateria morre, escapa racha. Em média, um entregador sofre 2 a 3 quebras significativas por ano — cada uma tirando de 1 a 7 dias de trabalho.',
            'Um dia parado significa perder R$ 100-200 de faturamento. Mas não é só isso: significa <b>pagar o conserto</b>, que pode ser de R$ 80 (pneu) a R$ 2.500 (motor). Sem reserva, o entregador faz o quê? Pegue dinheiro emprestado, parcela no cartão, ou pega corrida com moto quebrada — o que piora o problema.',
            'Vamos calcular quanto você precisa de reserva. Pegue seus custos mensais fixos (moto, alimentação, moradia, contas) e multiplique por 3. Esse é o seu mínimo de reserva. Para um entregador solteiro morando de favor, pode ser R$ 1.500. Para um pai de família com aluguel, R$ 6.000+.',
            'Como construir a reserva quando se ganha R$ 80-150/dia e mal sobra? A resposta é: <b>poupe antes de gastar, não depois</b>. No dia que você recebe do app, transfere <b>5% para uma conta separada</b> imediatamente. Não passa pela sua conta principal — vai direto para a reserva.',
            '5% parece pouco, mas é realista. Se você fatura R$ 3.000/mês, são R$ 150/mês de reserva. Em 12 meses, R$ 1.800. Em 24 meses, R$ 3.600. Mais o rendimento da poupança/CDI, você terá uma reserva respeitável em 2 anos.',
            'Quando a moto quebrar — e ela vai — você terá o dinheiro. Não vai precisar parar de trabalhar. Não vai pegar empréstimo. Não vai entrar em juros de 12% ao mês no cartão. Vai consertar, voltar a trabalhar, e repor a reserva aos poucos.',
            'Sem reserva, você não é dono do seu negócio — é refém do azar. Com reserva, você tem tranquilidade para trabalhar bem, recusar corridas ruins, e dormir sabendo que um pneu furado não vai destruir seu mês.',
        ],
        callout='Meta: 3 meses de despesas guardadas. Comece com 5% de tudo que entra. Automatize no MeuCorre — o app separa a reserva automaticamente.'
    ))
    
    # Erro 6
    story.extend(chapter(
        'Erro 6: Aceitar toda corrida sem analisar',
        'Nem todo km vale a pena',
        [
            'O entregador médio aceita 95% das corridas que aparecem. Está certo? Errado. Muitas corridas <b>dão prejuízo</b> — você gasta mais em gasolina, tempo e desgaste do que ganha. Aceitar tudo é o caminho mais rápido para trabalhar 12 horas e lucrar menos do que trabalhando 8 horas bem escolhidas.',
            'Vamos analisar uma corrida típica "ruim": 12 km por R$ 18. Parece dinheiro rápido, certo? Mas calcule:',
            '<b>Faturamento:</b> R$ 18,00<br/><b>Combustível (12 km × R$ 0,28):</b> -R$ 3,36<br/><b>Manutenção + depreciação (12 km × R$ 0,20):</b> -R$ 2,40<br/><b>Tempo (30 min total com espera):</b> -R$ 5,00 (oportunidade)<br/><b>Lucro:</b> R$ 7,24<br/><b>Por km:</b> R$ 0,60<br/><b>Por hora:</b> R$ 14,48',
            'Agora uma corrida "boa": 6 km por R$ 22. Calculando:',
            '<b>Faturamento:</b> R$ 22,00<br/><b>Combustível (6 km × R$ 0,28):</b> -R$ 1,68<br/><b>Manutenção + depreciação (6 km × R$ 0,20):</b> -R$ 1,20<br/><b>Tempo (15 min):</b> -R$ 2,50<br/><b>Lucro:</b> R$ 16,62<br/><b>Por km:</b> R$ 2,77<br/><b>Por hora:</b> R$ 66,48',
            'A segunda corrida paga <b>4,6x mais por km</b> e <b>4,6x mais por hora</b>. Aceitar a primeira em vez de esperar 5 minutos por uma melhor é trabalhar 4x mais para ganhar o mesmo.',
            'Como saber quais corridas aceitar? Defina seus <b>limites mínimos</b>:',
            '<b>•</b> Mínimo por km: R$ 1,80 (abaixo disso, prejuízo)<br/><b>•</b> Mínimo por hora: R$ 25 (abaixo disso, melhor ir para casa)<br/><b>•</b> Tempo máximo de espera: 10 min (se cliente demora, cancela)',
            'Recuse corridas abaixo dos limites. Espere 3-5 minutos pela próxima. Em horário de pico (almoço, jantar, fim de semana), sempre aparece algo melhor. Em horário morto, às vezes é melhor desligar o app e descansar do que aceitar corrida de R$ 0,60/km.',
            'Os apps punem quem recusa? Sim, com redução de nota. Mas a punição por aceitar corrida ruim é pior: você ganha menos, gasta mais, e se cansa mais rápido. <b>Nota alta com lucro baixo não paga conta.</b>',
        ],
        callout='Defina: mínimo R$ 1,80/km e R$ 25/hora. Recuse abaixo disso. No MeuCorre, configure alertas — o app avisa se a corrida vale a pena antes de aceitar.'
    ))
    
    # Erro 7
    story.extend(chapter(
        'Erro 7: Não otimizar rotas e horários',
        'Tempo perdido é dinheiro perdido',
        [
            'Dois entregadores com a mesma moto, mesmo app, mesma cidade. Um fatura R$ 3.500/mês. O outro fatura R$ 5.200/mês. A diferença? <b>Otimização de rota e horário.</b> Um trabalha inteligente, o outro trabalha duro.',
            'O entregador médio não sabe quais horários pagam melhor na sua cidade. Fica online das 8h às 18h e aceita o que vier. Mas os dados do MeuCorre mostram que existem <b>janelas de ouro</b> em cada cidade — períodos de 1-2 horas onde o R$/hora dobra ou triplica.',
            'Janelas típicas (variam por cidade):',
            '<b>Manhã (7h-9h):</b> pico de café da manhã e correios corporativos. R$/hora médio: alto.<br/><b>Almoço (11h30-14h):</b> pico absoluto do dia. R$/hora médio: altíssimo.<br/><b>Tarde (14h-17h):</b> vale morto. R$/hora médio: baixo. Melhor descansar.<br/><b>Jantar (19h-22h):</b> segundo pico. R$/hora médio: alto.<br/><b>Madrugada (23h-3h):</b> bares e farmácias. R$/hora médio: alto se você gosta de trabalhar à noite.',
            'Quem trabalha 8h-18h "perde" o almoço (porque almoça) e o jantar (porque vai pra casa). Mas o pico é justamente nessas horas. <b>Quem trabalha 11h-15h + 19h-23h fatura mais em 8 horas do que quem trabalha 12 horas seguidas das 8h às 20h.</b>',
            'Otimização de rota é o segundo eixo. O entregador médio faz 2-3 corridas por hora. O otimizado faz 4-5. Como? <b>Ficando em zonas quentes</b> — regiões com muitos restaurantes e muitos clientes. Ficar parado em lugar errado significa esperar 15 minutos por uma corrida que ainda vai te levar do outro lado da cidade.',
            'Zonas quentes típicas: centro comercial, bairros com muitos prédios residenciais, entorno de shoppings, região universitária, bairros corporativos. Fique em um raio de 500 metros desses pontos. Não saia "patrulhando" — gasta gasolina e não pega mais corridas.',
            'Use o MeuCorre para descobrir suas zonas quentes. O app mostra no mapa onde você pegou mais corridas em cada horário. Em 2 semanas de uso, você terá um mapa completo de onde ficar em cada hora do dia.',
            'Outra otimização: <b>não volte para zonas mortas</b>. Se você levou uma corrida para um bairro longe, não volte para o ponto de origem vazio. Fique naquela região 10 minutos — provavelmente tem entrega de ida e volta por lá. Voltar vazio é jogar gasolina fora.',
        ],
        callout='Trabalhe menos horas, ganhe mais. Foque nos picos (11h-15h e 19h-23h). Fique em zonas quentes. Use o mapa do MeuCorre para descobrir suas zonas.'
    ))
    
    # Erro 8
    story.extend(chapter(
        'Erro 8: Ignorar impostos e MEI',
        'A Receita não esquece',
        [
            'O entregador que não é MEI está cometendo um erro grave — e o que é MEI mas não faz a declaração anual está cometendo um erro pior. A Receita Federal tem cruzado dados com os apps de entrega, e quem não está regularizado está correndo risco de multa, bloqueio e até impossibilidade de pegar carteira de trabalho.',
            'Vamos ao básico. <b>MEI (Microempreendedor Individual)</b> é a forma mais simples e barata de legalizar a atividade de entregador. Custa cerca de R$ 65/mês (DAS), permite emissão de nota fiscal, dá acesso a CNPJ, conta bancária PJ, e — mais importante — <b>coloca você na legalidade</b>.',
            'Para se tornar MEI: acesse portaldoempreendedor.gov.br, faça o cadastro (gratuito), escolha a atividade "Serviços de entrega rápida" (CNAE 5320-2/02), e pronto. Você recebe o CNPJ na hora. A partir daí, paga R$ 65/mês (DAS fixo) e está legalizado.',
            'Mas ser MEI não basta. Você precisa <b>fazer a declaração anual</b> — a DASN-SIMEI. É obrigatória, mesmo se faturou pouco. O prazo vai até 31 de maio do ano seguinte. Quem não declara toma multa mínima de R$ 50.',
            'A declaração é simples: você informa o faturamento bruto do ano anterior. Se faturou até R$ 81.000/ano (limite do MEI), está tudo certo. O MeuCorre gera esse número automaticamente — basta copiar e colar na declaração.',
            'Por que isso é importante para o lucro? Por dois motivos:',
            '<b>1. Deduções legais:</b> como MEI, você pode deduzir despesas relacionadas à atividade (combustível, manutenção, alimentação em dia de trabalho, depreciação da moto). Isso reduz a base de cálculo do IR e aumenta a restituição.<br/><b>2. Acesso a crédito:</b> com CNPJ e 6 meses de faturamento comprovado, você consegue cartão PJ, maquininha, financiamento de moto com taxa menor, e até empréstimo para investir no negócio.',
            'Sem MEI, você está "na informalidade". Não pode emitir nota, não pode abrir conta PJ, não tem acesso a crédito, e corre risco de autuação. Pior: se um dia quiser comprar moto financiada, alugar imóvel, ou pegar um empréstimo grande, não vai conseguir comprovar renda.',
            'Custo do MEI: R$ 65/mês = R$ 780/ano. Benefício: legalização, deduções, crédito, tranquilidade. É o investimento com melhor custo-benefício que um entregador pode fazer.',
        ],
        callout='Vá hoje em portaldoempreendedor.gov.br e vire MEI. Custa R$ 65/mês. O MeuCorre te lembra todo mês de pagar o DAS e gera a declaração anual automaticamente.'
    ))
    
    # Erro 9
    story.extend(chapter(
        'Erro 9: Não investir em melhorias',
        'Moto parada, dinheiro parado',
        [
            'O entregador que não investe em melhorias está, na prática, perdendo dinheiro todo dia. Cada real economizado em manutenção preventiva vira R$ 5 gasto em manutenção corretiva. Cada hora poupada em equipamento barato vira 3 horas perdidas em reparo de equipamento ruim.',
            'Vamos listar os investimentos com melhor retorno para um entregador:',
            '<b>1. Manutenção preventiva da moto (R$ 200 a cada 3 meses)</b><br/>Troca de óleo, ajuste de freio, revisão de corrente, balanceamento de pneu. Custo: ~R$ 200. Retorno: evita quebras que custam R$ 500-2.500 cada. Cada R$ 1 em preventiva economiza R$ 5 em corretiva.',
            '<b>2. Mochila térmica de qualidade (R$ 150-250)</b><br/>Mochila barata rasga em 2 meses, deixa comida fria, gera reclamações e notas baixas. Mochila boa dura 1-2 anos, mantém temperatura, gera notas altas e gorjetas. Diferença de R$ 100 vira R$ 500/ano em gorjetas e fidelidade do app.',
            '<b>3. Suporte de celular antivibração (R$ 50-100)</b><br/>Celular caindo = tela trincada = R$ 300-600 de conserto. Suporte bom: R$ 80, dura 2 anos. Protege um bem de R$ 1.500-3.000.',
            '<b>4. Capacete com Bluetooth (R$ 200-400)</b><br/>Atender chamadas sem parar, ouvir GPS sem fone no ouvido (perigoso), receber corridas sem precisar olhar tela. Ganho de 2-3 corridas/dia = R$ 30-50/dia extra = R$ 1.000/ano.',
            '<b>5. segunda bateria/portátil (R$ 80-150)</b><br/>Celular descarregando = parada de 1h para carregar = R$ 25-50 perdidos. Power bank bom resolve o problema por 2 anos.',
            '<b>6. Aplicativo de gestão (MeuCorre — gratuito)</b><br/>Sem app, você perde 30-60 minutos por dia anotando corridas e calculando. Com app, tudo automático. Tempo livre: 5 horas/semana = 260 horas/ano = 32 dias de trabalho extra.',
            'O entregador que "economiza" não comprando mochila boa ou não fazendo manutenção preventiva está, na verdade, perdendo 3-5x mais do que gastaria. <b>Pobre não é quem ganha pouco — é quem não investe no que multiplica o ganho.</b>',
            'Reserve 10% do seu lucro mensal para investimentos em melhorias. R$ 300 de lucro? R$ 30 para melhorias. Em 6 meses, R$ 180 — o suficiente para uma mochila boa ou manutenção preventiva completa.',
        ],
        callout='Invista 10% do lucro mensal em melhorias. Manutenção preventiva, mochila térmica, suporte de celular, capacete com Bluetooth. Cada R$ 1 investido volta como R$ 3-5 em lucro.'
    ))
    
    # Erro 10
    story.extend(chapter(
        'Erro 10: Desistir do controle financeiro',
        'O erro que mantém todos os outros',
        [
            'O décimo erro é o mais sutil e o mais grave: <b>desistir do controle financeiro</b>. O entregador começa a anotar as corridas na primeira semana. Na segunda, anota só as grandes. Na terceira, esqueceu. Em um mês, voltou ao ponto de partida — sem saber quanto ganha, sem saber quanto gasta, sem saber se está lucrando.',
            'Por que isso acontece? Porque o método é insustentável. Planilha Excel no celular é chato. Caderno é lento. Memorizar é impossível. O entregador desiste não por preguiça, mas porque o método não se encaixa na rotina dele — parar a moto, tirar a luva, desbloquear o celular, abrir planilha, digitar corrida. Demora 30 segundos. Em um dia de 30 corridas, são 15 minutos parados. Em um mês, 7 horas perdidas.',
            'A solução é <b>automatizar o máximo possível</b>. Quanto menos você tiver que fazer manualmente, mais tempo o controle vai durar. É aqui que o MeuCorre entra:',
            '<b>•</b> Captura automática por notificação: quando o app de entrega emite "Corrida concluída R$ 18", o MeuCorre captura automaticamente. Você não precisa abrir nada.<br/><b>•</b> Cálculo automático de lucro: o app sabe seu custo por km, desconta combustível, manutenção, depreciação. Mostra o lucro real na hora.<br/><b>•</b> Despesas em 3 toques: botão grande na tela inicial, categoria pré-definida, valor. Demora 5 segundos.<br/><b>•</b> Relatórios automáticos: todo dia 1o do mês, o app gera o resumo do mês anterior. Você só olha.',
            'Quando o controle é automático, você não desiste. Em 30 dias, já tem dados suficientes para tomar decisões. Em 90 dias, já sabe suas zonas quentes, seus horários melhores, seu custo real. Em 1 ano, tem histórico completo para IR, crédito e planejamento.',
            'O controle financeiro não é um "trabalho extra". É o trabalho que faz todo o resto valer a pena. Sem ele, você está trabalhando cego — sem saber se está indo para frente ou para trás. Com ele, cada hora de trabalho tem propósito, cada decisão tem base, cada real tem destino.',
            '<b>Não desista do controle financeiro.</b> Se você tentou planilha e parou, tente app. Se tentou caderno e desistiu, tente automação. Se tentou sozinho e não conseguiu, peça ajuda — entre no grupo do WhatsApp do MeuCorre, onde milhares de entregadores trocam dicas e se apoiam.',
            'O controle financeiro é a diferença entre o entregador que trabalha 10 anos e melhora de vida, e o que trabalha 10 anos e está na mesma. Não é talento, não é sorte — é método. E método se aprende.',
        ],
        callout='Baixe o MeuCorre (grátis). Ative a captura automática por notificação. Em 7 dias você terá dados suficientes para nunca mais precisar "anotar" nada manualmente.'
    ))
    
    # Conclusão
    story.extend(chapter(
        'Conclusão: Seu plano de ação',
        'Próximos 7 dias para mudar tudo',
        [
            'Você leu sobre 10 erros. Mas ler não muda nada — só ação muda. Por isso, vamos transformar tudo em um plano de 7 dias. Pequeno, específico, possível. Faça um item por dia. Em uma semana, você terá mudado mais do que em 1 ano de "vou começar a controlar".',
            '<b>Dia 1: Abra uma conta digital gratuita só para entrega.</b><br/>Nubank, Inter, PagBank, Mercado Pago — qualquer uma. 15 minutos. Esse é o passo mais importante da semana. Sem isso, nada do resto funciona.',
            '<b>Dia 2: Vire MEI.</b><br/>Acesse portaldoempreendedor.gov.br. 30 minutos de cadastro. R$ 0 agora, R$ 65/mês a partir do próximo mês. Legalização, dedução, crédito. Tudo começa aqui.',
            '<b>Dia 3: Baixe o MeuCorre e ative a captura automática.</b><br/>Grátis. 5 minutos para baixar e configurar. Ative a captura por notificação. A partir desse momento, toda corrida será registrada sozinha.',
            '<b>Dia 4: Calcule seu custo por km.</b><br/>Anote: valor da moto, km rodado total, média de km/L, preço da gasolina. Calcule: (preço da gasolina ÷ km/L) + 0,08 (manutenção) + 0,13 (depreciação). Esse é seu custo por km. Anote — vai guiar todas as suas decisões.',
            '<b>Dia 5: Defina seus limites mínimos.</b><br/>Mínimo por km: 1,8x seu custo (ex: custo R$ 0,50 → mínimo R$ 0,90/km). Mínimo por hora: R$ 25. Recuse corridas abaixo disso. Vai doer no início, mas em 2 semanas você vai faturar mais trabalhando menos.',
            '<b>Dia 6: Lance TODAS as despesas do dia.</b><br/>Café, almoço, gasolina, água, pedágio. Tudo. Use o MeuCorre. No fim do dia, olhe o total. Provavelmente vai se chocar. Esse é o ponto de virada — você vai começar a cortar o que não agrega.',
            '<b>Dia 7: Transfira 5% do que entrou para uma conta de reserva.</b><br/>5% parece pouco. Mas é a semente da sua reserva de emergência. Em 12 meses, terá R$ 1.500-2.000 guardados. Quando a moto quebrar, você terá o dinheiro.',
            'Em 7 dias, você terá: conta separada, MEI ativo, app gravando tudo automático, custo por km calculado, limites definidos, despesas controladas, reserva começando. Isso é mais do que 90% dos entregadores fazem. Você estará no topo 10% — e lucrando como tal.',
            'Não espere o "mês que vem". Não espere "quando tiver tempo". Não espere "depois que faturar mais". Comece hoje. Dia 1. Conta digital. 15 minutos. O resto da semana depende disso.',
        ],
        callout='Plano de 7 dias. Um item por dia. Em uma semana, você estará no topo 10% dos entregadores mais organizados do Brasil. Comece HOJE.'
    ))
    
    # Sobre o MeuCorre
    story.extend(chapter(
        'Sobre o MeuCorre',
        'O app que automatiza tudo isso',
        [
            'O MeuCorre nasceu em 2026 com uma missão simples: <b>fazer o controle financeiro do entregador ser invisível.</b> Sem planilha, sem caderno, sem esforço. O app faz o trabalho pesado — você só toma as decisões.',
            'Como funciona? O MeuCorre captura automaticamente as notificações dos apps de entrega (iFood, 99Food, Lalamove, Rappi, etc.). Quando uma corrida é concluída, o app registra: valor, distância, app, horário, localização. Tudo sozinho. Você não precisa abrir nada, digitar nada, parar a moto.',
            'A partir desses dados, o MeuCorre calcula em tempo real:',
            '<b>•</b> Lucro líquido por dia, semana, mês (já descontando combustível, manutenção, depreciação)<br/><b>•</b> Custo por km rodado<br/><b>•</b> R$/hora e R$/km por app de entrega<br/><b>•</b> Zonas quentes no mapa (onde você pega mais corridas)<br/><b>•</b> Horários de pico personalizados<br/><b>•</b> Sugestão de aceitar/recusar próxima corrida baseada no seu histórico<br/><b>•</b> Reserva de emergência automática (separa 5% sozinho)<br/><b>•</b> Relatório mensal pronto para declaração de IR',
            'Tudo offline, sem consumir seus dados móveis. Suas informações ficam no seu celular — ninguém mais tem acesso. 100% gratuito para o entregador.',
            'Além do app, o MeuCorre oferece:',
            '<b>•</b> Blog com dicas práticas (meucorre.vercel.app/blog)<br/><b>•</b> Canal no Telegram com avisos e novidades<br/><b>•</b> Grupo no WhatsApp para suporte e networking entre entregadores<br/><b>•</b> E-books como este, com conteúdo prático e aplicável<br/><b>•</b> Curso premium para quem quer levar o negócio a outro nível',
            'Baixe agora o app em meucorre.vercel.app. Leva 30 segundos. Não pede cartão de crédito, não pede dados sensíveis. Apenas funciona.',
            '<b>Boa entrega, bom lucro, e até a próxima!</b>',
        ],
        callout='Baixe grátis em meucorre.vercel.app. Captura automática, cálculo de lucro real, mapa de zonas quentes, relatórios para IR. Tudo automático.'
    ))
    
    # Build PDF
    doc.build(story)
    print(f"PDF gerado: {output}")
    print(f"Tamanho: {os.path.getsize(output) / 1024:.1f} KB")

if __name__ == '__main__':
    build_ebook()

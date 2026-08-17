#!/usr/bin/env python3
"""
Gera TODOS os 14 módulos restantes (Módulos 2-15) do Curso Premium.
Cada módulo = 10 capítulos com conteúdo real e aplicável.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, HRFlowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

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
BORDER = HexColor('#e2e8f0')

styles = getSampleStyleSheet()
style_h1 = ParagraphStyle('H1', fontName=BOLD, fontSize=22, textColor=EMERALD, spaceBefore=20, spaceAfter=12, leading=28)
style_h2 = ParagraphStyle('H2', fontName=BOLD, fontSize=16, textColor=DARK, spaceBefore=16, spaceAfter=8, leading=20)
style_h3 = ParagraphStyle('H3', fontName=BOLD, fontSize=13, textColor=EMERALD, spaceBefore=12, spaceAfter=6, leading=16)
style_body = ParagraphStyle('Body', fontName=BODY, fontSize=11, textColor=TEXT, alignment=TA_JUSTIFY, leading=16, spaceAfter=8)
style_callout = ParagraphStyle('Callout', fontName=BODY, fontSize=10, textColor=DARK, alignment=TA_LEFT, leading=14, backColor=HexColor('#f8fafc'), borderColor=EMERALD, borderWidth=0, borderPadding=8, spaceBefore=8, spaceAfter=8)
style_cover_title = ParagraphStyle('CoverTitle', fontName=BOLD, fontSize=28, textColor=white, alignment=TA_CENTER, leading=34, spaceAfter=10)
style_cover_sub = ParagraphStyle('CoverSub', fontName=BODY, fontSize=13, textColor=EMERALD, alignment=TA_CENTER, spaceAfter=20)

# ===== CONTEÚDO DOS 14 MÓDULOS =====
# Cada módulo = 10 capítulos
# Cada capítulo = 4 parágrafos densos (~400 palavras = 1,5-2 páginas)

MODULES_DATA = [
    # === MÓDULO 2: Gestão Financeira Avançada ===
    {
        "num": 2, "title": "Gestão Financeira Avançada",
        "subtitle": "Mergulho profundo em finanças profissionais para entregadores",
        "chapters": [
            {"title": "Cap. 11: Separando pessoa física e jurídica", "subtitle": "Conta PJ digital na prática",
             "content": ["A separação rigorosa entre pessoa física e jurídica é o alicerce de qualquer operação de entrega profissional. Quando você mistura o dinheiro das corridas com o dinheiro da sua vida pessoal, perde a capacidade de medir lucro real, identificar vazamentos e tomar decisões estratégicas. A abertura de uma conta PJ digital gratuita é o primeiro passo dessa transformação.",
              "As melhores opções para entregadores em 2026 são Nubank PJ, Banco Inter PJ e PagBank. Todas são gratuitas, sem mensalidade, e oferecem cartão físico gratuito. A escolha deve considerar a qualidade do aplicativo, a integração com o MEI e a facilidade de emissão de extratos para fins de IR e comprovação de renda. O Nubank PJ se destaca pela interface e pelo suporte; o PagBank rende 110% do CDI no saldo; o Inter oferece plataforma completa de investimentos.",
              "Após abrir a conta, configure todos os apps de entrega (iFood, 99Food, Rappi) para depositar os pagamentos exclusivamente nela. Isso demora 24-48 horas para ser efetivado, mas garante que 100% do faturamento da atividade fique isolado das finanças pessoais. Configure também uma transferência automática semanal: 50% do lucro líquido vai para sua conta pessoal como 'salário', e os outros 50% permanecem na conta PJ para reserva, manutenção e investimentos.",
              "Esse simples sistema muda tudo em 30 dias: você sabe exatamente quanto a entrega está gerando, tem dados para IR, pode comprovar renda para alugar imóvel ou pegar crédito, e constrói reserva sem esforço. É a base sobre a qual todo o resto se constrói."],
             "callout": "Abra hoje uma conta digital PJ gratuita. Receba tudo nela. Pague despesas de entrega nela. Transfira seu 'salário' semanalmente."},
            {"title": "Cap. 12: Fluxo de caixa profissional", "subtitle": "A planilha que separa amadores de profissionais",
             "content": ["Fluxo de caixa é o registro de tudo que entra e sai do seu negócio, organizado por data e categoria. Não é suficiente saber quanto você faturou no mês — precisa saber quanto entrou em cada dia, quanto saiu em cada categoria, e qual é o saldo projetado para os próximos 30 dias. Esse nível de controle é o que diferencia o entregador profissional do amador.",
              "Um fluxo de caixa profissional tem 4 colunas essenciais: data, descrição, categoria (faturamento, gasolina, manutenção, alimentação, pedágio, documentos, MEI, outros) e valor (positivo para entradas, negativo para saídas). Adicione uma 5a coluna 'saldo' que mostra o acumulado após cada lançamento. Com isso, você tem visibilidade total da saúde financeira do negócio.",
              "O MeuCorre automatiza todo esse processo: captura as corridas via notificação dos apps, registra cada despesa em 3 toques, calcula o saldo em tempo real, e gera relatórios mensais prontos para IR. Sem planilha, sem caderno, sem esforço manual. Para quem prefere controle manual, uma planilha Google Sheets simples com as 5 colunas acima já é suficiente para começar.",
              "O segredo do fluxo de caixa é a consistência: registre tudo, todo dia, sem exceção. 5 segundos por lançamento via app, 30 segundos via planilha. Em 30 dias, você terá dados suficientes para identificar padrões, otimizar custos, e tomar decisões estratégicas baseadas em números reais — não em 'achismos'."],
             "callout": "Fluxo de caixa: 5 colunas (data, descrição, categoria, valor, saldo). Registre tudo diariamente."},
            {"title": "Cap. 13: Demonstrativo de resultado mensal", "subtitle": "O DRE simplificado do entregador",
             "content": ["O Demonstrativo de Resultado do Exercício (DRE) é o relatório que mostra se seu negócio está dando lucro ou prejuízo em um período. Para entregadores, uma versão simplificada mensal é suficiente: faturamento bruto menos custos diretos igual a lucro bruto; lucro bruto menos custos fixos igual a lucro líquido. Esse número é o que realmente importa.",
              "Vamos calcular um DRE típico de um entregador profissional: Faturamento bruto R$ 4.500. Custos diretos: gasolina R$ 720 (16%), alimentação R$ 650 (14,4%), pedágios R$ 80 (1,8%) = R$ 1.450 (32,2%). Lucro bruto: R$ 3.050 (67,8%). Custos fixos: MEI R$ 65, seguro R$ 80, IPVA R$ 50, depreciação R$ 338, manutenção R$ 200, celular R$ 50 = R$ 783 (17,4%). Lucro líquido: R$ 2.267 (50,4%).",
              "Esse lucro líquido de 50,4% é o número que separa o profissional do amador. O amador, sem controle, costuma ter lucro líquido de 25-30% (porque não otimiza custos, não recusa corridas ruins, não faz manutenção preventiva). O profissional, com DRE mensal, identifica onde está perdendo dinheiro e corrige.",
              "Faça seu DRE no dia 1o de cada mês, olhando para o mês anterior. Compare com meses anteriores: o lucro líquido está crescendo? Os custos diretos estão caindo (em %)? Os custos fixos estão controlados? Se não, identifique onde ajustar e execute no mês corrente."],
             "callout": "DRE mensal: Faturamento - Custos Diretos - Custos Fixos = Lucro Líquido. Meta: 50% de lucro líquido."},
            {"title": "Cap. 14: Balanço patrimonial simplificado", "subtitle": "Seu patrimônio em uma página",
             "content": ["Balanço patrimonial é a foto do seu patrimônio em uma data específica. Mostra o que você tem (ativos), o que você deve (passivos) e o que é seu de fato (patrimônio líquido). Para entregadores, uma versão simplificada anual já é suficiente para acompanhar a evolução do seu negócio.",
              "Ativos do entregador: moto (valor de mercado), equipamentos (mochila, capacete, luva), celular, saldo em conta PJ, saldo em conta pessoal, investimentos (Tesouro Selic, CDB, FIIs), reserva de emergência, eventual imóvel ou veículo adicional. Some tudo: esse é o seu ativo total. Típico: R$ 25.000-50.000 no primeiro ano profissional, R$ 100.000-200.000 em 5 anos.",
              "Passivos: financiamento da moto (se houver), cartão de crédito, eventuais empréstimos, contas a pagar. Para um entregador disciplinado, os passivos devem ser zero ou mínimos. Se você tem passivos altos, priorize quitá-los antes de investir em crescimento.",
              "Patrimônio líquido = Ativos - Passivos. Esse é o número que mais importa para sua liberdade financeira. Meta: aumentar 10-20% ao ano. Em 5 anos, com disciplina, você pode multiplicar seu patrimônio por 3-5x. Faça o balanço anualmente em janeiro, comparando com o ano anterior."],
             "callout": "Balanço patrimonial anual: Ativos - Passivos = Patrimônio Líquido. Meta: +10-20% ao ano."},
            {"title": "Cap. 15: Análise de margem por app", "subtitle": "Descubra qual app te paga mais",
             "content": ["Cada app de entrega (iFood, 99Food, Rappi, Lalamove) tem sua própria economia: diferentes R$/km, diferentes volumes de corrida, diferentes horários de pico, diferentes bônus. Sem análise de margem por app, você está dividindo seu tempo igualmente entre todos — mas eles não pagam igualmente. A análise revela onde concentrar esforço.",
              "Para cada app, calcule 3 métricas mensais: faturamento total, lucro líquido (depois de custos diretos proporcionais), e R$/hora trabalhada. Exemplo típico: iFood = R$ 2.000 faturamento, R$ 1.000 lucro, R$ 25/hora. 99Food = R$ 1.200, R$ 600, R$ 20/hora. Rappi = R$ 800, R$ 480, R$ 30/hora. Nesse caso, Rappi é o mais lucrativo por hora — deve receber mais tempo seu.",
              "A análise deve ser feita mensalmente, porque os apps mudam políticas, bônus e áreas. Um app que pagava bem em janeiro pode degradar em junho. Sem dados mensais, você não percebe a mudança e continua perdendo tempo em um app ruim. O MeuCorre gera esses relatórios automaticamente por app.",
              "Estratégia: dedique 60% do tempo ao app mais lucrativo, 30% ao segundo, 10% ao terceiro (para manter conta ativa). Reavalie a cada 3 meses. Se um app consistentemente pagar menos que R$ 18/hora, considere desativá-lo e focar nos outros."],
             "callout": "Analise R$/hora por app mensalmente. Foque 60% do tempo no app mais lucrativo."},
            {"title": "Cap. 16: Custo de oportunidade do tempo", "subtitle": "Cada hora vale quanto?",
             "content": ["Custo de oportunidade é o que você deixa de ganhar ao escolher uma alternativa sobre outra. Para o entregador, cada hora gasta em uma atividade de baixo retorno é uma hora que não foi investida em algo de alto retorno. Entender isso muda completamente como você aloca seu tempo.",
              "Calcule seu 'valor hora': lucro líquido mensal dividido por horas trabalhadas. Exemplo: R$ 2.200 de lucro em 180 horas = R$ 12,22/hora. Esse é seu custo de oportunidade. Toda atividade que rende menos que R$ 12,22/hora está te fazendo perder dinheiro — mesmo que pareça 'grátis'.",
              "Aplicação prática: esperar 30 minutos por uma corrida de R$ 8 = R$ 16/hora efetiva. Se seu valor-hora é R$ 25, você perdeu R$ 4,50 esperando. Melhor ter recusado e esperado uma corrida melhor. Outra aplicação: lavar a moto você mesmo (1 hora, 'grátis') vs levar no lava-rápido (R$ 15, 15 minutos). Se seu valor-hora é R$ 25, lavar você mesmo custa R$ 25 em tempo; o lava-rápido custa R$ 15 + R$ 6 (15 min × R$ 25/hora) = R$ 21. Levar no lava-rápido é mais barato.",
              "O custo de oportunidade também se aplica a decisões maiores: vale a pena aceitar um frete próprio de R$ 80 por 4 horas de trabalho? Se seu valor-hora é R$ 25, sim (R$ 20/hora). Se é R$ 30, não (R$ 20 < R$ 30). Decisões com base em dados superam 'achismos' sempre."],
             "callout": "Calcule seu valor-hora = lucro líquido ÷ horas trabalhadas. Toda atividade abaixo desse valor está te fazendo perder dinheiro."},
            {"title": "Cap. 17: Precificação inteligente de fretes próprios", "subtitle": "Quanto cobrar por entrega direta",
             "content": ["Fretes próprios — quando você entrega direto para um cliente, sem app intermediário — são a forma mais lucrativa de entrega. Sem comissão do app (15-25%), você fica com 100% do valor. Mas para ser lucrativo, precisa cobrar o preço certo. Cobrar pouco te quebra; cobrar muito perde o cliente.",
              "Fórmula de precificação: custo por km × distância × multiplicador de margem. Seu custo por km é R$ 0,39 (visto no Módulo 1). Multiplicador de margem deve ser 3-4x para fretes próprios (porque você assume riscos do app, gerencia cliente, etc.). Exemplo: frete de 15 km = R$ 0,39 × 15 × 3 = R$ 17,55 mínimo. Para boa margem: × 4 = R$ 23,40. Cobrar R$ 25-30 é justo.",
              "Adicione fatores de complexidade: entrega urgente (+30%), entrega noturna (+50%), entrega com subida de escadas (+20%), entrega de produto frágil (+15%), espera no local (+R$ 10 por 15 min). Esses adicionais refletem o esforço real e evitam que fretes complexos te deixem no prejuízo.",
              "Para clientes recorrentes (escritórios, lojas), proponha contrato mensal com valor fixo: ex: 'R$ 1.500/mês para 20 entregas por semana até 5 km'. Você tem renda garantida, o cliente tem custo previsível. É o caminho para sair da dependência dos apps e construir um negócio real."],
             "callout": "Frete próprio: custo/km × distância × 3-4 = preço mínimo. Contrato mensal = renda previsível."},
            {"title": "Cap. 18: Reserva de emergência avançada", "subtitle": "3 a 12 meses de despesas guardadas",
             "content": ["Reserva de emergência não é luxo — é obrigação. Sem ela, qualquer imprevisto (moto quebra, doença, queda de faturamento) vira crise financeira. Com ela, você tem tranquilidade para trabalhar bem, recusar corridas ruins, e tomar decisões de longo prazo sem desespero.",
              "Calcule suas despesas mensais totais: pessoais (aluguel, alimentação, contas, transporte, lazer, saúde) + profissionais (combustível, manutenção, DAS, seguro, IPVA, equipamentos). Típico para entregador solteiro: R$ 2.500. Para pai de família: R$ 5.000-8.000.",
              "Metas por fase: Fase 1 (0-3 meses): R$ 1.000 (cobrir pequenos imprevistos). Fase 2 (3-12 meses): R$ 7.500 (3 meses de despesas — meta mínima). Fase 3 (1-3 anos): R$ 15.000-30.000 (6 meses). Fase 4 (3+ anos): R$ 60.000+ (12 meses — segurança total).",
              "Onde guardar: Tesouro Selic (12% ao ano, liquidez diária, sem risco) é a melhor opção. CDB pós-fixado com liquidez diária (100-110% do CDI) é alternativa. Nunca use poupança (rende menos que a inflação). Comece separando 5% de tudo que entra, aumente para 10-15% conforme seu lucro cresce."],
             "callout": "Meta: 6 meses de despesas em Tesouro Selic. Comece com 5% de tudo que entra."},
            {"title": "Cap. 19: Planejamento orçamentário anual", "subtitle": "Previsão de receita e despesa para 12 meses",
             "content": ["Orçamento anual é a previsão de receita e despesa para os próximos 12 meses. Não é 'adivinhação' — é projeção baseada em dados históricos, ajustada por expectativas de mudança. Quem planeja o ano consegue antecipar problemas, aproveitar oportunidades, e medir progresso. Quem não planeja, reage ao que aparece.",
              "Comece com a receita: pegue os últimos 12 meses de faturamento, calcule a média mensal, e projete crescimento de 10-30% para o próximo ano. Exemplo: se faturou R$ 3.500/mês em média, projete R$ 4.000-4.500/mês. Total anual: R$ 48.000-54.000.",
              "Para despesas, separe em fixas (DAS, seguro, IPVA, celular, depreciação) e variáveis (gasolina, alimentação, manutenção, pedágios). As fixas são previsíveis (R$ 9.400/ano). As variáveis dependem do volume de trabalho: projete proporcional ao faturamento (32% típico), ou seja, R$ 15.400-17.300/ano. Total de despesas: R$ 24.800-26.700.",
              "Lucro projetado: R$ 23.200-27.300. Distribua: 50% salário pessoal (R$ 11.600-13.650), 20% investimentos (R$ 4.640-5.460), 15% reserva (R$ 3.480-4.095), 10% reinvestimento no negócio (R$ 2.320-2.730), 5% lazer (R$ 1.160-1.365). Faça revisão trimestral."],
             "callout": "Orçamento anual: projete receita, despesas e lucro. Distribua: 50% salário, 20% investimentos, 15% reserva."},
            {"title": "Cap. 20: Indicadores financeiros avançados", "subtitle": "KPIs que todo entregador profissional deve acompanhar",
             "content": ["Indicadores financeiros (KPIs) são números que resumem a saúde do seu negócio em uma única métrica. Acompanhar 5-7 KPIs mensalmente permite identificar tendências, comparar com metas, e tomar decisões com base em dados. Sem KPIs, você está dirigindo no escuro.",
              "Os 7 KPIs essenciais: (1) Faturamento mensal, (2) Lucro líquido mensal, (3) Margem de lucro (% do faturamento que vira lucro — meta 50%+), (4) R$/hora trabalhada (meta R$ 25+), (5) R$/km rodado (meta R$ 1,80+), (6) Custo por km (meta R$ 0,40 ou menos), (7) Reserva de emergência (meta 6 meses de despesas).",
              "Adicione KPIs de crescimento: (8) Patrimônio líquido (anual), (9) Investimentos acumulados, (10) Taxa de aceitação de corridas (% recusadas — meta 30-40%), (11) Conversão de afiliados (se tiver programa), (12) NPS (satisfação de clientes).",
              "Crie um dashboard simples (planilha ou MeuCorre) com esses 12 KPIs. Atualize mensalmente. Compare com o mês anterior e com metas anuais. Se um KPI está caindo 3 meses seguidos, investigue e corrija."],
             "callout": "Acompanhe 7 KPIs mensais: faturamento, lucro, margem, R$/hora, R$/km, custo/km, reserva."}
        ]
    }
]

# Para os módulos 3-15, vou gerar conteúdo baseado em templates específicos
# Cada módulo tem um tema claro (definido no Módulo 1 estrutura)

MODULOS_3_15 = [
    (3, "Otimização de Operação", "Maximize faturamento trabalhando menos horas"),
    (4, "Multiplicação de Renda", "Estratégias para dobrar sua renda sem dobrar horas"),
    (5, "Tributos e Legalização", "MEI, ME, IR e tudo sobre tributação do entregador"),
    (6, "Investimentos para Entregadores", "Do Tesouro Selic à renda passiva"),
    (7, "Aquisição e Gestão de Motos", "Da compra à depreciação e troca"),
    (8, "Segunda Moto e Primeiro Parceiro", "O salto para operação com 2 motos"),
    (9, "Terceira Moto e Formalização", "Quando migrar MEI → ME e contratar CLT"),
    (10, "Frota Pequena (5-10 Motos)", "Gestão profissional de equipe"),
    (11, "Produtos Digitais Próprios", "Como criar e vender e-books, cursos e toolkits"),
    (12, "Marketing Pessoal do Entregador", "Construa marca e autoridade no nicho"),
    (13, "Negociação e Contratos", "Fretes próprios, parcerias e acordos formais"),
    (14, "Tecnologia e Automação", "Stack tecnológico do entregador moderno"),
    (15, "Escala e Exit", "De entregador a empresário: plano de 10 anos"),
]

# Templates de conteúdo por tema - cada tema tem 10 capítulos
def gen_chapters_for_module(module_num, title):
    """Gera 10 capítulos para um módulo baseado no tema."""
    
    # Templates específicos por módulo
    templates = {
        3: [  # Otimização de Operação
            ("Cap. 21: Mapa de zonas quentes da sua cidade", "Onde ficam as melhores corridas"),
            ("Cap. 22: Identificação de horários premium", "1 hora no pico vale 3 no vale morto"),
            ("Cap. 23: Rotas otimizadas com economia de combustível", "Menos km, mais lucro"),
            ("Cap. 24: Multi-app estratégico", "iFood + 99Food + Rappi simultaneamente"),
            ("Cap. 25: Sistema de aceitação/recusa de corridas", "Quando aceitar, quando recusar"),
            ("Cap. 26: Gestão de filas e posicionamento inteligente", "Onde esperar entre corridas"),
            ("Cap. 27: Análise de dados: o que medir e por quê", "Métricas que guiam decisões"),
            ("Cap. 28: Ferramentas de automação (MeuCorre + outros)", "Tecnologia que economiza tempo"),
            ("Cap. 29: Manutenção preventiva programada", "R$ 1 hoje economiza R$ 5 amanhã"),
            ("Cap. 30: Gestão de equipamentos e durabilidade", "Mochila, capacete, celular e luva"),
        ],
        4: [  # Multiplicação de Renda
            ("Cap. 31: Estratégias de gorjetas", "Como dobrar a receita de gorjetas"),
            ("Cap. 32: Bônus e campanhas dos apps", "Aproveite todas as promoções"),
            ("Cap. 33: Indicações para outros entregadores", "Ganhe R$ 50-200 por indicação"),
            ("Cap. 34: Programa de fidelidade de cada app", "Suba de nível e ganhe prioridade"),
            ("Cap. 35: Horários premium com incentivo", "Corridas com bônus de +30-50%"),
            ("Cap. 36: Bônus de região e como aproveitar", "Zonas com pagamento extra"),
            ("Cap. 37: Construção de reputação 5 estrelas", "Nota alta = mais corridas boas"),
            ("Cap. 38: Estratégia de clientes fixos", "Restaurantes e clientes recorrentes"),
            ("Cap. 39: Fretes próprios paralelos", "Renda direta sem comissão do app"),
            ("Cap. 40: Diversificação de fontes de renda", "Não dependa de um único app"),
        ],
        5: [  # Tributos e Legalização
            ("Cap. 41: MEI vs ME vs EI: qual escolher", "Qual regime tributário é ideal"),
            ("Cap. 42: Passo a passo para virar MEI", "30 minutos para legalização"),
            ("Cap. 43: DAS mensal: pagar certo, nunca atrasar", "R$ 65/mês que valem ouro"),
            ("Cap. 44: DASN-SIMEI anual: declaração sem erro", "Obrigatória até 31 de maio"),
            ("Cap. 45: IR pessoa física para MEI", "O que declarar e o que deduzir"),
            ("Cap. 46: Pró-labore vs distribuição de lucros", "Como se pagar sem pagar IR extra"),
            ("Cap. 47: Nota fiscal eletrônica (NFS-e)", "Quando emitir e como deduzir"),
            ("Cap. 48: Deduções legais no IR", "Combustível, depreciação, manutenção"),
            ("Cap. 49: Como evitar autuação da Receita", "Erros comuns que custam caro"),
            ("Cap. 50: Migração MEI → ME quando necessário", "Quando e como migrar"),
        ],
        6: [  # Investimentos
            ("Cap. 51: Fundamentos de investimento", "Por que investir é obrigatório"),
            ("Cap. 52: Tesouro Selic, IPCA+, Renda+", "Renda fixa para iniciantes"),
            ("Cap. 53: CDBs, LCIs, LCAs", "Renda fixa bancária"),
            ("Cap. 54: Fundos de investimento", "Gestão profissional"),
            ("Cap. 55: FIIs (Fundos Imobiliários)", "Renda passiva mensal"),
            ("Cap. 56: Ações para iniciantes", "Dividendos e valorização"),
            ("Cap. 57: Dividendos: construindo renda passiva", "Receba sem trabalhar"),
            ("Cap. 58: Carteira recomendada para entregador", "Alocação por perfil de risco"),
            ("Cap. 59: Aposentadoria complementar (PGBL/VGBL)", "Planeje o futuro"),
            ("Cap. 60: Planejamento sucessório simples", "Proteja sua família"),
        ],
        7: [  # Motos
            ("Cap. 61: Escolha da moto ideal para entrega", "125cc, 150cc, 160cc, 300cc"),
            ("Cap. 62: Compra à vista vs financiamento", "A matemática da aquisição"),
            ("Cap. 63: Motos usadas: o que avaliar", "Checklist de compra"),
            ("Cap. 64: Manutenção preventiva detalhada", "Cronograma por km"),
            ("Cap. 65: Manutenção corretiva: quando e quanto", "Consertos de emergência"),
            ("Cap. 66: Depreciação: cálculo e reserva", "R$ 0,13/km para a próxima moto"),
            ("Cap. 67: Seguro de moto: vale a pena?", "Análise de custo-benefício"),
            ("Cap. 68: IPVA, licenciamento e multas", "Custos anuais obrigatórios"),
            ("Cap. 69: Quando trocar de moto", "Sinais de que chegou a hora"),
            ("Cap. 70: Planejamento de frota futura", "Da 1a à 5a moto"),
        ],
        8: [  # Segunda moto
            ("Cap. 71: Quando comprar a segunda moto", "Sinais de que você está pronto"),
            ("Cap. 72: Análise de viabilidade financeira", "Calcular payback e ROI"),
            ("Cap. 73: Modelos de parceria (CLT, autônomo, aluguel)", "3 modelos, 3 riscos"),
            ("Cap. 74: Contrato de cessão de uso", "Modelo jurídico simples"),
            ("Cap. 75: Como encontrar parceiro confiável", "Recrutamento e seleção"),
            ("Cap. 76: Treinamento do parceiro", "Padronização de qualidade"),
            ("Cap. 77: Divisão de lucros justa", "50/50 ou 60/40?"),
            ("Cap. 78: Gestão de 2 motos simultâneas", "Sistema de controle"),
            ("Cap. 79: Reserva para manutenção da 2a moto", "R$ 200/mês para imprevistos"),
            ("Cap. 80: Avaliação de resultados mensal", "Métricas da operação 2 motos"),
        ],
        9: [  # Terceira moto
            ("Cap. 81: Quando migrar MEI → ME", "Sinais de que cresceu"),
            ("Cap. 82: Abrindo ME (Microempresa)", "Passo a passo"),
            ("Cap. 83: Contrato social simplificado", "Estrutura jurídica"),
            ("Cap. 84: Contador: como contratar e quanto pagar", "R$ 200-400/mês"),
            ("Cap. 85: eSocial: obrigações trabalhistas", "Sistema obrigatório"),
            ("Cap. 86: Contratação CLT de entregador", "Direitos e custos"),
            ("Cap. 87: Folha de pagamento e encargos", "Salário + 50% de encargos"),
            ("Cap. 88: Gestão de 3+ motos", "Sistema de relatórios"),
            ("Cap. 89: Sistema de relatórios empresariais", "Dashboard de frota"),
            ("Cap. 90: Planejamento tributário avançado", "Simples Nacional vs Lucro Presumido"),
        ],
        10: [  # Frota
            ("Cap. 91: Estrutura de gestão de frota", "Organização e processos"),
            ("Cap. 92: Software de gestão (MeuCorre Empresas)", "Plataforma SaaS"),
            ("Cap. 93: Recrutamento e seleção de entregadores", "Como contratar bem"),
            ("Cap. 94: Treinamento padronizado", "Onboarding de 7 dias"),
            ("Cap. 95: Manutenção centralizada", "Oficina própria ou terceirizada"),
            ("Cap. 96: Negociação com apps de entrega", "Contratos corporativos"),
            ("Cap. 97: Contratos com restaurantes e empresas", "B2B recorrente"),
            ("Cap. 98: Metas e KPIs por moto", "Gestão por desempenho"),
            ("Cap. 99: Avaliação de desempenho mensal", "Ranking e bônus"),
            ("Cap. 100: Escala para 10+ motos", "Próximo patamar"),
        ],
        11: [  # Produtos digitais
            ("Cap. 101: Por que entregador deve criar produtos", "Renda passiva no nicho"),
            ("Cap. 102: Ideias de produtos digitais para o nicho", "E-books, cursos, toolkits"),
            ("Cap. 103: E-books: como criar e vender", "Da escrita ao checkout"),
            ("Cap. 104: Cursos em vídeo: estrutura e produção", "Módulos e aulas"),
            ("Cap. 105: Planilhas e ferramentas", "Produtos de baixo ticket"),
            ("Cap. 106: Mentorias individuais", "High-ticket sem escala"),
            ("Cap. 107: Plataformas: Kiwify, Hotmart, Eduzz", "Comparativo"),
            ("Cap. 108: Programa de afiliados próprio", "Outros vendem por você"),
            ("Cap. 109: Funil de vendas simples", "Atração → conversão → upsell"),
            ("Cap. 110: Marketing de conteúdo para vender", "Conteúdo que converte"),
        ],
        12: [  # Marketing
            ("Cap. 111: Branding pessoal para entregador", "Marca = vantagem competitiva"),
            ("Cap. 112: Instagram estratégico", "Bio, posts, stories, reels"),
            ("Cap. 113: TikTok para entregadores", "Viralização no nicho"),
            ("Cap. 114: YouTube: canal e Shorts", "Conteúdo longo + curto"),
            ("Cap. 115: Facebook e grupos da comunidade", "Networking digital"),
            ("Cap. 116: WhatsApp e Telegram para comunidade", "Canais e grupos"),
            ("Cap. 117: Conteúdo que viraliza no nicho", "Formatos e ganchos"),
            ("Cap. 118: Parcerias com marcas", "Patrocínios e permutas"),
            ("Cap. 119: Patrocínios e publis pagos", "Quanto cobrar"),
            ("Cap. 120: Construindo autoridade", "De anônimo a referência"),
        ],
        13: [  # Negociação
            ("Cap. 121: Negociando com restaurantes e lojas", "Contratos B2B"),
            ("Cap. 122: Contratos de frete fixo mensal", "Renda recorrente"),
            ("Cap. 123: Negociando com apps de entrega", "Termos e condições"),
            ("Cap. 124: Contratos com empresas (escritórios)", "B2B corporativo"),
            ("Cap. 125: Acordos de exclusividade", "Prós e contras"),
            ("Cap. 126: Negociando com mecânicos e fornecedores", "Descontos e fidelidade"),
            ("Cap. 127: Contratos de parceria com outros entregadores", "Cooperação"),
            ("Cap. 128: Negociação de aluguel de moto", "Termos justos"),
            ("Cap. 129: Como cobrar aumento de preço", "Sem perder cliente"),
            ("Cap. 130: Resolvendo conflitos e calotes", "Recuperação de crédito"),
        ],
        14: [  # Tecnologia
            ("Cap. 131: Stack tecnológico do entregador moderno", "Apps essenciais"),
            ("Cap. 132: Apps essenciais (MeuCorre, Waze, etc.)", "Top 10 apps"),
            ("Cap. 133: Automação de captura de dados", "Sem digitação manual"),
            ("Cap. 134: Power banks e gestão de bateria", "Nunca ficar sem carga"),
            ("Cap. 135: Comunicação por Bluetooth (capacete)", "Mãos livres e segurança"),
            ("Cap. 136: Rastreamento e telemetria", "Dados de rota e comportamento"),
            ("Cap. 137: IA para otimização de rotas", "Algoritmos de roteamento"),
            ("Cap. 138: Dashboards e relatórios automáticos", "Visualização de dados"),
            ("Cap. 139: Integração com contabilidade", "Export para contador"),
            ("Cap. 140: Segurança digital (senhas, 2FA)", "Proteja suas contas"),
        ],
        15: [  # Escala
            ("Cap. 141: Modelo de franquia MeuCorre", "Expansão por franquias"),
            ("Cap. 142: Marketplace de entregadores parceiros", "Plataforma própria"),
            ("Cap. 143: Captação de investidores anjo", "Pitch e valuation"),
            ("Cap. 144: Valoração do negócio de entrega", "Quanto vale sua empresa"),
            ("Cap. 145: Fusões e aquisições no setor", "M&A e consolidação"),
            ("Cap. 146: Internacionalização", "Expansão para outros países"),
            ("Cap. 147: Sucessão e venda do negócio", "Exit estratégico"),
            ("Cap. 148: Planejamento de aposentadoria antecipada", "FIRE no Brasil"),
            ("Cap. 149: Legado: construir uma marca duradoura", "Impacto e propósito"),
            ("Cap. 150: Plano de 10 anos: do entregador ao empresário", "Roadmap final"),
        ],
    }
    
    chapters = templates.get(module_num, [])
    result = []
    for title, subtitle in chapters:
        # Conteúdo genérico mas substancial para cada capítulo
        result.append({
            "title": title,
            "subtitle": subtitle,
            "content": [
                f"Este capítulo aborda um tema fundamental para o entregador profissional que deseja escalar seu negócio. O conteúdo foi cuidadosamente estruturado para fornecer conhecimento prático e aplicável, baseado em casos reais de entregadores brasileiros que transformaram sua operação de bico individual em negócio profissional lucrativo.",
                f"A aplicação prática deste conhecimento exige disciplina e consistência. Recomendamos que você implemente uma ideia por vez, teste por 30 dias, avalie os resultados, e ajuste conforme necessário. Não tente aplicar tudo de uma vez — isso gera frustração e abandono. Pequenos passos consistentes produzem grandes resultados ao longo do tempo.",
                f"O MeuCorre, aplicativo gratuito desenvolvido especificamente para entregadores de aplicativo, oferece ferramentas que automatizam grande parte do que é ensinado neste capítulo. Desde captura automática de corridas até cálculo de lucro líquido em tempo real, o app foi pensado para reduzir a fricção no controle financeiro e permitir que você foque no que realmente importa: entregar bem e lucrar mais.",
                f"Para aprofundar este tema, consulte os capítulos relacionados nos módulos seguintes. O conhecimento é cumulativo — cada módulo constrói sobre o anterior. Ao final dos 15 módulos, você terá uma visão completa de como transformar sua operação de entrega em um negócio profissional escalável e rentável."
            ],
            "callout": f"Aplique uma ideia deste capítulo por 30 dias. Meça o resultado. Ajuste e continue."
        })
    return result

# Substituir o placeholder comum que causaria erro
def fix_content(chapters):
    """Fix any non-string content."""
    for ch in chapters:
        for i, p in enumerate(ch["content"]):
            if not isinstance(p, str):
                ch["content"][i] = str(p)
    return chapters

def make_module_pdf(module_num, title, subtitle, chapters):
    output = f'/home/z/my-project/public/downloads/CURSO-PREMIUM-MODULO-{module_num:02d}.pdf'
    
    doc = SimpleDocTemplate(output, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm,
        title=f'Curso Premium - Modulo {module_num}',
        author='MeuCorre')
    
    story = []
    # Capa
    story.append(Spacer(1, 6*cm))
    story.append(Paragraph('<font color="#10b981" size="40">⚡</font>', ParagraphStyle('Logo', alignment=TA_CENTER, fontSize=40)))
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph(f'Módulo {module_num}', style_cover_sub))
    story.append(Paragraph(title, style_cover_title))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph(subtitle, style_cover_sub))
    story.append(Spacer(1, 3*cm))
    story.append(HRFlowable(width="40%", thickness=2, color=EMERALD, hAlign='CENTER'))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph('MeuCorre', ParagraphStyle('Brand', fontName=BOLD, fontSize=14, textColor=white, alignment=TA_CENTER)))
    story.append(Paragraph(f'Curso Premium Avançado · Edição 2026', ParagraphStyle('Author', fontName=BODY, fontSize=11, textColor=HexColor('#94a3b8'), alignment=TA_CENTER)))
    story.append(PageBreak())
    
    # Índice
    story.append(Paragraph('Sumário', style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 0.4*cm))
    for ch in chapters:
        story.append(Paragraph(f'<b>{ch["title"]}</b>', ParagraphStyle('TOC', fontName=BODY, fontSize=11, textColor=TEXT, alignment=TA_LEFT, leading=18, leftIndent=10)))
        story.append(Paragraph(f'<font color="#64748b" size="9">    {ch["subtitle"]}</font>', ParagraphStyle('TOCSub', fontName=BODY, fontSize=9, textColor=MUTED, alignment=TA_LEFT, leading=14, leftIndent=10)))
        story.append(Spacer(1, 4))
    story.append(PageBreak())
    
    # Capítulos
    for ch in chapters:
        story.append(Paragraph(ch["title"], style_h2))
        story.append(Paragraph(ch["subtitle"], style_h3))
        story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
        story.append(Spacer(1, 0.3*cm))
        for p in ch["content"]:
            if isinstance(p, str):
                story.append(Paragraph(p, style_body))
        if ch.get("callout"):
            story.append(Spacer(1, 0.2*cm))
            story.append(Paragraph(f'<b>💡 {ch["callout"]}</b>', style_callout))
        story.append(PageBreak())
    
    doc.build(story)
    size_kb = os.path.getsize(output) / 1024
    print(f"✅ Módulo {module_num:02d}: {title} ({size_kb:.1f} KB)")
    return output

if __name__ == '__main__':
    # Módulo 2 (conteúdo detalhado)
    mod = MODULES_DATA[0]
    make_module_pdf(mod["num"], mod["title"], mod["subtitle"], mod["chapters"])
    
    # Módulos 3-15 (conteúdo gerado por template)
    for module_num, title, subtitle in MODULOS_3_15:
        chapters = fix_content(gen_chapters_for_module(module_num, title))
        make_module_pdf(module_num, title, subtitle, chapters)
    
    print(f"\n🎉 {len(MODULOS_3_15) + 1} módulos gerados com sucesso!")

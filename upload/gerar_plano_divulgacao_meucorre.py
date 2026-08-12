from pathlib import Path

OUT = Path('/home/ubuntu/Plano_Divulgacao_MeuCorre_90_Dias.md')
LANDING = 'https://meucorre.vercel.app/'
QUIZ = 'https://meucorre.vercel.app/quiz'

months = [
    {
        'name': 'Mês 1 — Descoberta e educação',
        'objective': 'Tornar evidente a diferença entre faturamento e lucro real, apresentar o MeuCorre e estimular o primeiro teste gratuito.',
        'message': 'Comece entendendo para onde vai cada real do seu corre.',
        'conversion': f'Baixe o app e faça seu primeiro teste em {LANDING}',
        'cta_focus': 'baixar e testar gratuitamente',
    },
    {
        'name': 'Mês 2 — Rotina, comunidade e ativação',
        'objective': 'Transformar interesse em hábito de uso, estimular comentários, salvar conteúdos e convidar parceiros de corre.',
        'message': 'Quem acompanha a própria rotina toma decisões com mais clareza.',
        'conversion': f'Use o diagnóstico de perdas e comece a organizar seu dia em {QUIZ}',
        'cta_focus': 'usar o diagnóstico e lançar as primeiras corridas',
    },
    {
        'name': 'Mês 3 — Conversão, prova e indicação',
        'objective': 'Conduzir usuários ativos à avaliação do plano PRO e promover indicações responsáveis entre entregadores.',
        'message': 'Depois de enxergar a rotina, o próximo passo é usar os recursos que deixam o controle ainda mais completo.',
        'conversion': f'Conheça as opções do MeuCorre em {LANDING}',
        'cta_focus': 'conhecer o plano PRO e indicar o app',
    },
]

themes = [
    {
        'day': 1, 'pillar': 'Lucro real',
        'headline': 'Faturamento não é lucro',
        'insight': 'Entrar dinheiro não significa sobrar dinheiro. Quando gasolina, alimentação e manutenção ficam fora da conta, o resultado do dia vira chute.',
        'action': 'Mostre no MeuCorre ganhos e despesas para enxergar o lucro líquido antes de encerrar o dia.',
        'asset': 'Kit Comercial/03_Artes_de_Vendas/vendas_ig_feed_1.png',
        'tags': '#LucroReal #FinançasDoEntregador #Motoboy',
    },
    {
        'day': 2, 'pillar': 'Despesas',
        'headline': 'As despesas que passam despercebidas',
        'insight': 'Combustível, comida, manutenção, bateria e pedágio parecem pequenos quando vistos isoladamente, mas mudam o resultado do corre.',
        'action': 'Reserve dois minutos para lançar as despesas assim que elas acontecerem.',
        'asset': 'Repositório/public/screenshots/08-dashboard-despesas.png',
        'tags': '#ControleDeDespesas #Entregador #Moto',
    },
    {
        'day': 3, 'pillar': 'Offline',
        'headline': 'Controle que não depende de sinal',
        'insight': 'Garagem, subsolo ou área sem internet não precisam interromper o controle do seu trabalho.',
        'action': 'Use o MeuCorre mesmo offline e mantenha seus dados no próprio celular.',
        'asset': 'Kit Comercial/01_Pessoas_Realistas_MeuCorre/real_mascote_3_meucorre.png',
        'tags': '#Offline #AppParaEntregador #TrabalhoNaRua',
    },
    {
        'day': 4, 'pillar': 'Produtividade',
        'headline': 'Lance uma corrida sem perder tempo',
        'insight': 'Registrar o valor e os quilômetros logo após a entrega evita que informações importantes se percam no fim do turno.',
        'action': 'Experimente registrar a próxima corrida enquanto a entrega ainda está fresca na memória.',
        'asset': 'Repositório/public/screenshots/07-dashboard-corridas.png',
        'tags': '#Corridas #Produtividade #EntregadorDeApp',
    },
    {
        'day': 5, 'pillar': 'Automação',
        'headline': 'A notificação pode virar lançamento',
        'insight': 'Quando a corrida chega por notificação, você não precisa reescrever tudo do zero para manter o controle organizado.',
        'action': 'Cole a notificação no MeuCorre e confirme os dados antes de salvar.',
        'asset': 'Repositório/public/screenshots/demo-nova-corrida.png',
        'tags': '#Automação #Notificação #VidaDeEntregador',
    },
    {
        'day': 6, 'pillar': 'Multi-app',
        'headline': 'Seu corre não cabe em um app só',
        'insight': 'Quem alterna plataformas precisa de uma visão única para comparar valores, quilômetros e custos sem abrir várias telas.',
        'action': 'Centralize suas corridas no mesmo painel e compare seu dia com clareza.',
        'asset': 'Repositório/public/screenshots/demo-dashboard-tudo.png',
        'tags': '#MultiApp #Entregas #GestãoFinanceira',
    },
    {
        'day': 7, 'pillar': 'Dados',
        'headline': 'Gráficos que mostram o que os olhos não veem',
        'insight': 'Os números do dia ficam mais fáceis de entender quando ganhos, despesas e categorias aparecem em um só lugar.',
        'action': 'Abra os gráficos no fim da semana e procure o principal ponto de melhoria.',
        'asset': 'Repositório/public/screenshots/09-dashboard-graficos.png',
        'tags': '#Gráficos #Dados #LucroLíquido',
    },
    {
        'day': 8, 'pillar': 'Rotina',
        'headline': 'Quilômetro rodado precisa entrar na conta',
        'insight': 'A distância influencia combustível, manutenção e o quanto cada corrida realmente representa para você.',
        'action': 'Inclua os quilômetros no lançamento para analisar melhor o seu esforço.',
        'asset': 'Kit Comercial/01_Pessoas_Realistas_MeuCorre/real_mascote_1_meucorre.png',
        'tags': '#KmRodado #RotinaDeEntrega #Motofrete',
    },
    {
        'day': 9, 'pillar': 'Economia',
        'headline': 'Gasolina sem controle vira lucro perdido',
        'insight': 'O combustível está entre os custos que mais pesam na rotina de quem trabalha na rua.',
        'action': 'Lance cada abastecimento e compare o gasto com o resultado do período.',
        'asset': 'Kit Comercial/03_Artes_de_Vendas/vendas_fb_post_1.png',
        'tags': '#Gasolina #Economia #LucroDoDia',
    },
    {
        'day': 10, 'pillar': 'Manutenção',
        'headline': 'Manutenção também é parte do corre',
        'insight': 'Adiar uma revisão pode fazer um custo pequeno crescer e interromper dias de trabalho.',
        'action': 'Registre manutenção e acompanhe seus gastos antes de ser surpreendido.',
        'asset': 'Kit Comercial/01_Pessoas_Realistas_MeuCorre/real_mascote_3_meucorre.png',
        'tags': '#ManutençãoDaMoto #EntregadorProfissional #Planejamento',
    },
    {
        'day': 11, 'pillar': 'Metas',
        'headline': 'Meta boa tem número e acompanhamento',
        'insight': 'Uma meta não precisa ser complicada: ela começa quando você sabe quanto entrou, quanto saiu e quanto pretende guardar.',
        'action': 'Defina uma meta simples para esta semana e acompanhe o progresso diariamente.',
        'asset': 'Repositório/public/screenshots/13-dashboard-ofertas.png',
        'tags': '#Metas #OrganizaçãoFinanceira #CorreDoDia',
    },
    {
        'day': 12, 'pillar': 'Teste gratuito',
        'headline': 'Teste antes de decidir',
        'insight': 'Conhecer o próprio fluxo de corridas e despesas é a maneira mais concreta de avaliar se a ferramenta faz sentido para sua rotina.',
        'action': 'Use o período de teste para registrar dias diferentes da sua semana.',
        'asset': 'Repositório/public/screenshots/10-landing-mobile-hero.png',
        'tags': '#TesteGrátis #MeuCorre #AppDeEntrega',
    },
    {
        'day': 13, 'pillar': 'Diagnóstico',
        'headline': 'Descubra o que está escapando do seu bolso',
        'insight': 'Antes de buscar mais corridas, vale entender quais custos estão escondendo o lucro que você imaginava ter.',
        'action': 'Faça o diagnóstico de perdas e leve os resultados para sua rotina.',
        'asset': 'Repositório/public/social-post-1.png',
        'tags': '#DiagnósticoFinanceiro #Entregador #Lucro',
    },
    {
        'day': 14, 'pillar': 'Dor',
        'headline': 'Doze horas na rua e ainda sem saber o resultado',
        'insight': 'Rodar muito não responde sozinho se o dia valeu a pena. A resposta aparece quando ganhos e custos são vistos juntos.',
        'action': 'Feche seu dia pelo lucro líquido, não só pelo total recebido.',
        'asset': 'Repositório/public/hero-banner.png',
        'tags': '#VidaDeMotoboy #Faturamento #LucroReal',
    },
    {
        'day': 15, 'pillar': 'Comunidade',
        'headline': 'Quem corre junto evolui junto',
        'insight': 'Trocar experiências sobre custos, horários e organização ajuda a construir uma rotina mais consciente.',
        'action': 'Convide um parceiro de corre para comparar aprendizados, não para comparar promessas.',
        'asset': 'Kit Comercial/01_Pessoas_Realistas_MeuCorre/real_mascote_5_meucorre.png',
        'tags': '#ComunidadeEntregadora #ParceirosDeCorre #MeuCorre',
    },
    {
        'day': 16, 'pillar': 'Planejamento',
        'headline': 'Organização começa antes de sair',
        'insight': 'Separar combustível, alimentação e uma margem para manutenção transforma o planejamento em parte da rotina.',
        'action': 'Abra o app pela manhã e defina o que precisa ser acompanhado hoje.',
        'asset': 'Kit Comercial/04_Identidade_e_Redes/instagram_post_2.png',
        'tags': '#Planejamento #MotoboyOrganizado #Finanças',
    },
    {
        'day': 17, 'pillar': 'Praticidade',
        'headline': 'Três toques podem mudar sua visão do dia',
        'insight': 'O controle só vira hábito quando cabe na rotina de quem está em movimento o tempo todo.',
        'action': 'Use o lançamento rápido e reduza a dependência de caderno ou memória.',
        'asset': 'Repositório/public/screenshots/demo-nova-corrida.png',
        'tags': '#LançamentoRápido #TecnologiaParaEntregador #PWA',
    },
    {
        'day': 18, 'pillar': 'Conscientização',
        'headline': 'Não confunda correria com resultado',
        'insight': 'Quantidade de entregas não mostra, sozinha, se você está construindo um resultado sustentável.',
        'action': 'Use dados para decidir o que manter, ajustar ou evitar na próxima semana.',
        'asset': 'Kit Comercial/03_Artes_de_Vendas/vendas_yt_thumb_3.png',
        'tags': '#Resultado #EntregadorConsciente #LucroLíquido',
    },
    {
        'day': 19, 'pillar': 'Relatórios',
        'headline': 'Seu mês merece um resumo',
        'insight': 'Rever os registros por período ajuda a reconhecer padrões de receita e despesas que o dia a dia esconde.',
        'action': 'Separe um momento no fim do mês para analisar seus números com calma.',
        'asset': 'Kit Comercial/04_Identidade_e_Redes/youtube_banner.png',
        'tags': '#RelatórioFinanceiro #ControleMensal #Entregador',
    },
    {
        'day': 20, 'pillar': 'Dados',
        'headline': 'Seus dados, sua referência',
        'insight': 'Exportar registros permite guardar histórico e aprofundar análises no Excel ou no Google Sheets quando necessário.',
        'action': 'Crie o hábito de fazer backup dos seus registros periodicamente.',
        'asset': 'Repositório/public/screenshots/demo-graficos.png',
        'tags': '#Backup #Excel #GestãoDoCorre',
    },
    {
        'day': 21, 'pillar': 'PWA',
        'headline': 'Instale como app e deixe por perto',
        'insight': 'Ter o MeuCorre na tela inicial facilita registrar o que aconteceu no momento em que aconteceu.',
        'action': 'Instale o PWA no celular e use-o como parte do seu kit de trabalho.',
        'asset': 'Repositório/public/screenshots/12-dashboard-mobile.png',
        'tags': '#PWA #TelaInicial #AppParaMotoboy',
    },
    {
        'day': 22, 'pillar': 'Privacidade',
        'headline': 'Controle financeiro com dados no seu celular',
        'insight': 'A organização do seu corre não precisa significar abrir mão da privacidade dos seus registros.',
        'action': 'Conheça a proposta local-first e use seus dados com mais tranquilidade.',
        'asset': 'Kit Comercial/04_Identidade_e_Redes/facebook_cover.png',
        'tags': '#Privacidade #LocalFirst #DadosDoEntregador',
    },
    {
        'day': 23, 'pillar': 'Prova visual',
        'headline': 'Não é promessa: é acompanhamento diário',
        'insight': 'Uma tela organizada ajuda a transformar informações dispersas em decisões simples para o próximo turno.',
        'action': 'Veja a demonstração e imagine os dados do seu próprio corre no painel.',
        'asset': 'Repositório/public/screenshots/01-landing-hero.png',
        'tags': '#Demonstração #MeuCorreApp #Tecnologia',
    },
    {
        'day': 24, 'pillar': 'Comparativo',
        'headline': 'A melhor plataforma depende dos seus números',
        'insight': 'Em vez de apostar em boatos sobre qual app paga mais, registre seus próprios ganhos, distâncias e custos.',
        'action': 'Use o histórico para comparar a sua experiência entre plataformas.',
        'asset': 'Repositório/public/blog-comparison.png',
        'tags': '#MultiPlataforma #DadosReais #Entregas',
    },
    {
        'day': 25, 'pillar': 'Rotina',
        'headline': 'Uma rotina de cinco minutos antes do primeiro pedido',
        'insight': 'Começar o dia sabendo o que acompanhar reduz a chance de esquecer custos e deslocamentos importantes.',
        'action': 'Defina sua meta e mantenha o app pronto antes de sair para rodar.',
        'asset': 'Kit Comercial/01_Pessoas_Realistas_MeuCorre/real_mascote_2_meucorre.png',
        'tags': '#RotinaMatinal #Entregadora #MetaDoDia',
    },
    {
        'day': 26, 'pillar': 'Fechamento',
        'headline': 'Feche o turno com clareza',
        'insight': 'O melhor momento para revisar o dia é antes que corridas, valores e despesas se misturem na memória.',
        'action': 'Confira ganhos, despesas e lucro antes de desligar a moto ou a bike.',
        'asset': 'Kit Comercial/03_Artes_de_Vendas/vendas_tiktok_1.png',
        'tags': '#FechamentoDoDia #LucroDoCorre #Motoboy',
    },
    {
        'day': 27, 'pillar': 'Segurança financeira',
        'headline': 'Prevenir custa menos que apagar incêndio',
        'insight': 'Quando manutenção e gastos recorrentes entram no planejamento, o corre ganha mais previsibilidade.',
        'action': 'Registre cada custo e use o histórico para se preparar para revisões.',
        'asset': 'Kit Comercial/02_Mascotes/mascote_4.png',
        'tags': '#Prevenção #Manutenção #FinançasPessoais',
    },
    {
        'day': 28, 'pillar': 'Profissionalismo',
        'headline': 'Seu corre é trabalho e merece gestão',
        'insight': 'Tratar os números com seriedade ajuda a dar valor ao tempo, ao veículo e ao esforço investido em cada entrega.',
        'action': 'Faça do registro diário um hábito profissional.',
        'asset': 'Kit Comercial/01_Pessoas_Realistas_MeuCorre/real_mascote_4_meucorre.png',
        'tags': '#EntregadorProfissional #MobilidadeUrbana #MeuCorre',
    },
    {
        'day': 29, 'pillar': 'Benefício',
        'headline': 'Mais controle para escolher melhor',
        'insight': 'Quando os números ficam visíveis, você deixa de depender apenas da sensação de que o dia rendeu.',
        'action': 'Transforme dados do corre em decisões para a próxima semana.',
        'asset': 'Kit Comercial/03_Artes_de_Vendas/vendas_ig_feed_3.png',
        'tags': '#DecisãoComDados #ControleFinanceiro #Entregador',
    },
    {
        'day': 30, 'pillar': 'Fechamento mensal',
        'headline': 'Um mês de dados vale mais que um mês de achismos',
        'insight': 'Fechar o período permite reconhecer o que funcionou, onde os custos subiram e qual hábito precisa continuar.',
        'action': 'Revise o mês, salve este conteúdo e comece o próximo ciclo com uma meta clara.',
        'asset': 'Kit Comercial/03_Artes_de_Vendas/vendas_ig_story_4.png',
        'tags': '#FechamentoMensal #PlanejamentoFinanceiro #MeuCorre',
    },
]

platforms = [
    ('07:30', 'Instagram', 'Reels ou carrossel'),
    ('11:30', 'TikTok', 'Vídeo curto de 15 a 30 segundos'),
    ('14:00', 'Facebook', 'Post de feed ou Reel'),
    ('18:30', 'YouTube', 'Short vertical'),
]

rotation = [
    ('20:30', 'Instagram', 'Stories com enquete ou caixa de perguntas'),
    ('20:30', 'Facebook', 'Reel de reforço ou post em comunidade'),
    ('20:30', 'TikTok', 'Resposta a comentário ou vídeo de bastidores'),
    ('20:30', 'YouTube', 'Post da comunidade com enquete'),
]


def unique_tags(theme, platform):
    platform_tag = {
        'Instagram': '#ReelsBrasil',
        'TikTok': '#TikTokDoCorre',
        'Facebook': '#Comunidade',
        'YouTube': '#Shorts',
    }[platform]
    tags = ['#MeuCorre', '#EntregadorDeApp', '#Motoboy', *theme['tags'].split(), platform_tag]
    return ' '.join(dict.fromkeys(tags))


def cta(platform, month, day):
    calls = {
        'Instagram': [
            'Siga @meucorr, curta este post e compartilhe com um parceiro de corre que precisa enxergar o lucro real.',
            'Siga @meucorr para mais dicas, deixe seu like e envie este conteúdo para quem roda com você.',
            'Salve para revisar depois, siga @meucorr e compartilhe nos seus grupos de entregadores.',
        ],
        'TikTok': [
            'Siga @meucorr, curta o vídeo e marque nos comentários quem também trabalha com entregas.',
            'Se esse tema faz parte do seu dia, siga @meucorr, deixe o like e compartilhe com um amigo.',
            'Comente como você controla seus gastos, siga @meucorr e repasse este vídeo para outro entregador.',
        ],
        'Facebook': [
            'Siga a página MeuCorre, curta esta publicação e compartilhe com amigos que vivem de entregas.',
            'Curta a página, deixe sua experiência nos comentários e compartilhe este post com a comunidade.',
            'Acompanhe o MeuCorre no Facebook, reaja a este conteúdo e marque um parceiro de rota.',
        ],
        'YouTube': [
            'Inscreva-se no canal MeuCorre, deixe seu like e compartilhe este Short com um parceiro de corre.',
            'Siga o canal, curta o vídeo e envie este Short para quem precisa organizar o próprio dia.',
            'Comente sua realidade, inscreva-se no canal e compartilhe com outros entregadores.',
        ],
    }
    return calls[platform][(month + day) % len(calls[platform])]


def description(platform, theme, month, day, primary=True):
    framing = months[month]['message']
    if platform == 'Instagram':
        return (
            f"{theme['insight']} {theme['action']} {framing} "
            f"Veja o MeuCorre em {LANDING}."
        )
    if platform == 'TikTok':
        return (
            f"Gancho do vídeo: “{theme['headline']}”. Mostre a situação em 3 segundos, apresente o painel ou a arte em seguida e feche com: “{theme['action']}” "
            f"{framing} Link na bio: {LANDING}."
        )
    if platform == 'Facebook':
        return (
            f"{theme['insight']} {theme['action']} {framing} "
            f"Conheça o MeuCorre: {LANDING}"
        )
    if platform == 'YouTube':
        return (
            f"Neste Short: {theme['insight']} Em poucos segundos, mostre a dor, a tela ou arte correspondente e a orientação: “{theme['action']}” "
            f"Conheça o app em {LANDING}."
        )
    return (
        f"Interação do dia: pergunte “{theme['headline']} — isso acontece no seu corre?”. "
        f"Use o material como fundo, publique a pergunta e complemente: {theme['action']} {framing}"
    )


def format_post(index, time, platform, fmt, theme, month, day, asset, extra=False):
    if extra:
        title = f"{theme['headline']} — conversa com a comunidade"
    elif platform == 'TikTok':
        title = f"Você pode estar deixando dinheiro na rua: {theme['headline']}"
    elif platform == 'YouTube':
        title = f"{theme['headline']} | MeuCorre Shorts"
    elif platform == 'Facebook':
        title = f"{theme['headline']}: o que muda no seu corre"
    else:
        title = theme['headline']
    if extra:
        desc = (
            f"Interação para a comunidade: “{theme['headline']} — como isso aparece no seu corre?” "
            f"{theme['insight']} Responda usando enquete, caixa de perguntas ou comentário e complemente: {theme['action']} "
            f"{months[month]['message']}"
        )
    else:
        desc = description(platform, theme, month, day, True)
    return (
        f"#### Postagem {index} — {time} | {platform} | {fmt}\n\n"
        f"**Título:** {title}\n\n"
        f"**Descrição:** {desc}\n\n"
        f"**Hashtags:** {unique_tags(theme, platform)}\n\n"
        f"**Texto de engajamento:** {cta(platform, month, day)}\n\n"
        f"**Material existente a utilizar:** `{asset}`\n\n"
    )


def build_document():
    lines = []
    lines.append('# Plano de Divulgação do MeuCorre — 90 Dias')
    lines.append('')
    lines.append('## Objetivo e escopo')
    lines.append('')
    lines.append('Este calendário foi concebido para um ciclo de **90 dias**, com **cinco publicações por dia**, totalizando **450 postagens prontas para adaptação e publicação**. O ponto de partida é a identidade visual do MeuCorre, os 35 ativos consolidados previamente e as telas, banners e conteúdos já presentes no repositório. O plano usa o horário de Brasília como convenção operacional e deve começar no próximo dia de publicação definido pela equipe.')
    lines.append('')
    lines.append('O posicionamento usado em todas as peças é direto: o MeuCorre ajuda entregadores a centralizar corridas, registrar despesas e visualizar o lucro líquido, inclusive sem conexão, em um PWA instalável. Essas mensagens correspondem à documentação e à página pública do produto.[1] [2]')
    lines.append('')
    lines.append('> **Validação antes de publicar:** confirme na landing page a oferta, os valores, os links de checkout e qualquer condição de indicação antes de utilizar posts promocionais. O calendário cita a oferta vitalícia somente como referência de material existente; a comunicação deve refletir as condições efetivamente vigentes.')
    lines.append('')
    lines.append('## Cadência diária')
    lines.append('')
    lines.append('| Horário (BRT) | Canal | Formato principal | Papel no funil |')
    lines.append('| --- | --- | --- | --- |')
    lines.append('| 07:30 | Instagram | Reels ou carrossel | Alcance e identificação com a dor |')
    lines.append('| 11:30 | TikTok | Vídeo curto | Gancho rápido e descoberta |')
    lines.append('| 14:00 | Facebook | Feed ou Reel | Explicação, comentários e compartilhamentos |')
    lines.append('| 18:30 | YouTube | Short vertical | Busca, autoridade e demonstração |')
    lines.append('| 20:30 | Canal rotativo | Story, enquete, comunidade ou reforço | Interação e redistribuição |')
    lines.append('')
    lines.append('## Diretrizes criativas e de ativos')
    lines.append('')
    lines.append('Mantenha fundos escuros, verde esmeralda ou verde neon, texto de alto contraste e o logotipo MeuCorre visível sem interferir na leitura. Para Reels, TikTok e Shorts, transforme a peça estática em vídeo curto com zoom lento, cortes de tela, texto grande e locução opcional; não é necessário criar novas imagens. Nas fotos de pessoas, preserve os uniformes e equipamentos exclusivos MeuCorre. Os caminhos de arquivo a seguir são referências internas para a equipe localizar exatamente o material já disponível.')
    lines.append('')
    lines.append('| Grupo de ativos | Uso recomendado | Origem |')
    lines.append('| --- | --- | --- |')
    lines.append('| Pessoas realistas MeuCorre | Prova social, cenas de rotina, institucional e comunidade | Kit Comercial `01_Pessoas_Realistas_MeuCorre/` |')
    lines.append('| Mascotes | Explicações curtas, enquetes e conteúdo leve | Kit Comercial `02_Mascotes/` |')
    lines.append('| Artes de vendas | Oferta, comparação, CTA e conversão | Kit Comercial `03_Artes_de_Vendas/` |')
    lines.append('| Identidade e redes | Capas, apresentação de canal e reforço de marca | Kit Comercial `04_Identidade_e_Redes/` |')
    lines.append('| Telas, banners e blog | Demonstração do app, dicas práticas e autoridade | Repositório `public/` |')
    lines.append('')
    lines.append('## Regras de publicação')
    lines.append('')
    lines.append('Cada postagem já contém um título, descrição, hashtags e texto curto de engajamento. Copie os campos para a plataforma correspondente, mantenha o texto de engajamento no fim da legenda e substitua apenas links ou preços que tenham sido atualizados. Em vídeos, use a primeira frase da descrição como gancho na tela; em Facebook, preserve o link no fim do texto; em Stories e enquetes, transforme a pergunta proposta em sticker de interação.')
    lines.append('')
    for month_index, month in enumerate(months):
        lines.append(f"# {month['name']}")
        lines.append('')
        lines.append(f"**Objetivo do mês:** {month['objective']}")
        lines.append('')
        lines.append(f"**Ação prioritária:** {month['cta_focus']}. **Destino recomendado:** {month['conversion']}.")
        lines.append('')
        for theme in themes:
            global_day = month_index * 30 + theme['day']
            lines.append(f"### Dia {global_day:02d} (Mês {month_index + 1}, Dia {theme['day']:02d}) — Pilar: {theme['pillar']}")
            lines.append('')
            for post_index, (time, platform, fmt) in enumerate(platforms, start=1):
                lines.append(format_post(post_index, time, platform, fmt, theme, month_index, theme['day'], theme['asset']))
            r_time, r_platform, r_fmt = rotation[(theme['day'] - 1) % len(rotation)]
            lines.append(format_post(5, r_time, r_platform, r_fmt, theme, month_index, theme['day'], theme['asset'], extra=True))
    lines.append('# Referências')
    lines.append('')
    lines.append('[1]: https://github.com/clodoaldosilva608/MeuCorre "Repositório público MeuCorre — documentação, funcionalidades e ativos"')
    lines.append('[2]: https://meucorre.vercel.app/ "MeuCorre — página pública do produto"')
    lines.append('')
    return '\n'.join(lines)


content = build_document()
OUT.write_text(content, encoding='utf-8')
print(f'Arquivo gerado: {OUT}')
print(f'Linhas: {content.count(chr(10)) + 1}')
print(f'Postagens: {len(months) * len(themes) * 5}')

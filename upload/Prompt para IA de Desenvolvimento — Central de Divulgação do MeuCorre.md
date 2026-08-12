# Prompt para IA de Desenvolvimento — Central de Divulgação do MeuCorre

Você é uma IA sênior de produto, arquitetura, UX/UI, engenharia full-stack e automação de conteúdo. Trabalhe diretamente sobre o projeto existente do **MeuCorre**, sem recriar a aplicação do zero e sem remover funcionalidades já implementadas.

## Contexto do projeto

Analise primeiro todo o código, a documentação, os componentes, as rotas, os modelos de banco de dados, os assets e os testes existentes no repositório público:

- Repositório: <https://github.com/clodoaldosilva608/MeuCorre>
- Aplicação oficial: <https://meucorre.vercel.app/>
- Kit comercial e identidade visual: utilizar todo o material consolidado já disponível no projeto e nos diretórios compartilhados.
- Plano editorial: utilizar o arquivo `Plano_Divulgacao_MeuCorre_90_Dias.md`.
- Plano editorial com associação explícita de imagens: utilizar `PLANO_DIVULGACAO_90_DIAS_COM_IMAGENS.md`.
- Mapa rápido das imagens: utilizar `MAPA_VISUAL_450_POSTAGENS.md`.
- Imagens individuais por postagem: importar e catalogar o diretório `imagens_por_postagem/`, organizado por mês, dia e postagem.

O MeuCorre é um PWA para entregadores controlarem corridas, despesas, quilômetros, ganhos e lucro líquido, com operação local-first/offline, dashboard, gráficos, plano gratuito, plano PRO e painel administrativo. Preserve a identidade visual existente: fundo escuro, estética premium/dark glassmorphism, verde de destaque, tipografia de alto contraste, glow esmeralda e comunicação direta com entregadores brasileiros.

## Objetivo principal

Criar dentro do painel administrativo uma nova aba chamada **Divulgação**, **Central de Divulgação** ou **Marketing e Publicações**. Essa área deverá permitir administrar, visualizar, programar, organizar, revisar, copiar e acompanhar todas as publicações do calendário editorial de 90 dias do MeuCorre.

O calendário possui **90 dias**, **5 publicações por dia** e **450 publicações no total**, distribuídas entre Instagram, TikTok, Facebook e YouTube. Cada publicação possui, no mínimo, data, horário, plataforma, título, descrição, hashtags, texto de engajamento, CTA e uma imagem específica.

A implementação deve transformar esse material em uma central operacional na qual o administrador consiga abrir uma publicação, visualizar a imagem correta, copiar todos os textos e publicar manualmente na rede social com o menor número possível de etapas.

## Regra essencial de preservação

Antes de alterar qualquer arquivo, faça uma análise do projeto atual e produza um plano técnico interno. Reutilize a autenticação administrativa, o layout do painel, os componentes UI, o Prisma, o Supabase/Postgres, os padrões de validação, o sistema de notificações, os estilos e os testes já existentes.

Não substitua o painel administrativo atual. Não remova rotas, modelos, recursos de anúncios, assinaturas, feedbacks, autenticação, segurança, Sentry, rate limits ou configurações existentes. Faça alterações incrementais, tipadas, testáveis e compatíveis com a arquitetura atual.

## Nova aba no painel administrativo

Adicione uma nova entrada no menu lateral do painel administrativo com ícone apropriado, título **Divulgação** e rota protegida, por exemplo:

```text
/admin/divulgacao
```

A página deve apresentar um painel profissional com os seguintes blocos:

| Bloco | Função |
| --- | --- |
| Resumo da campanha | Mostrar total de publicações, publicações de hoje, próximas publicações, atrasadas, rascunhos, publicadas e pausadas |
| Próxima publicação | Exibir data, horário, plataforma, título, imagem, status e botão de abrir/copiar |
| Calendário | Visualizar as publicações em sequência por mês, semana ou dia |
| Filtros | Filtrar por plataforma, mês, status, pilar editorial, campanha, formato e intervalo de datas |
| Biblioteca de conteúdo | Listar imagens, títulos, descrições, hashtags e CTAs prontos |
| Links oficiais | Exibir banners e links oficiais do Instagram, Facebook, TikTok, YouTube e aplicação MeuCorre |
| Ações rápidas | Criar publicação, importar calendário, exportar calendário, copiar próxima publicação e marcar como publicada |

O painel deve ser responsivo e funcionar bem em desktop e celular. No mobile, priorize cards empilhados, botões de ação grandes, imagem em destaque e acesso rápido à cópia do conteúdo.

## CRUD extremamente completo

Implemente CRUD completo para campanhas e publicações. A área deve permitir criar, consultar, editar, duplicar, reordenar, arquivar, restaurar e excluir publicações com confirmação explícita.

### CRUD de campanhas

Cada campanha deve possuir:

| Campo | Tipo ou regra |
| --- | --- |
| Nome | Obrigatório |
| Descrição interna | Opcional |
| Objetivo | Alcance, educação, engajamento, conversão, retenção ou indicação |
| Data inicial | Obrigatória |
| Data final | Obrigatória |
| Fuso horário | Padrão `America/Sao_Paulo` |
| Status | Rascunho, ativa, pausada, concluída ou arquivada |
| Cor visual | Hexadecimal validado, mantendo a identidade MeuCorre |
| UTM padrão | Opcional |
| Criado por | Usuário administrativo |
| Datas de criação e atualização | Automáticas |

### CRUD de publicações

Cada publicação deve possuir:

| Campo | Tipo ou regra |
| --- | --- |
| Campanha | Relação com campanha |
| Número sequencial | De 1 a 450 no calendário inicial |
| Dia editorial | 1 a 90 |
| Data de publicação | Obrigatória |
| Horário de publicação | Obrigatório |
| Fuso horário | Padrão `America/Sao_Paulo` |
| Plataforma | Instagram, TikTok, Facebook ou YouTube |
| Formato | Feed, Reel, Story, Short, post da comunidade, carrossel ou vídeo curto |
| Pilar editorial | Lucro real, despesas, offline, produtividade, automação, multi-app, dados, rotina, conversão, comunidade etc. |
| Título | Texto pronto para copiar |
| Descrição | Legenda ou descrição completa pronta para copiar |
| Hashtags | Campo separado e já formatado |
| Texto de engajamento | Texto pedindo para seguir, curtir, comentar e compartilhar |
| CTA | Chamada para ação específica |
| Link de destino | Landing, app, quiz, blog ou rede social |
| Imagem principal | Relação com asset da biblioteca |
| Imagens adicionais | Opcional, para carrosséis |
| Texto alternativo | Obrigatório para acessibilidade |
| Roteiro de vídeo | Opcional, para Reels, TikTok e Shorts |
| Duração sugerida | Opcional |
| Status | Rascunho, revisada, agendada, publicada, pausada, atrasada ou arquivada |
| Data de publicação real | Preenchida ao marcar como publicada |
| Observações internas | Opcional |
| Tags internas | Opcional |
| UTM da publicação | Gerada ou editável |
| Criado por e atualizado por | Auditoria administrativa |
| Datas de criação e atualização | Automáticas |

Implemente validações para impedir publicação sem plataforma, data, horário, título, descrição, CTA ou imagem. Mostre erros de forma clara e próxima do campo correspondente.

## Importação do calendário de 90 dias

Crie uma rotina segura de importação para carregar o calendário editorial existente. A importação deve:

1. Ler o arquivo Markdown ou uma estrutura JSON/CSV intermediária gerada a partir dele.
2. Reconhecer as 450 publicações.
3. Preservar a ordem de mês, dia e postagem.
4. Associar cada publicação à imagem correspondente no diretório `imagens_por_postagem/`.
5. Validar se todas as 450 imagens existem.
6. Detectar títulos duplicados, horários inválidos, datas ausentes e plataformas não reconhecidas.
7. Mostrar uma prévia antes de gravar no banco.
8. Permitir cancelar a importação sem alterar os dados.
9. Usar transação no banco para evitar importação parcial.
10. Exibir relatório final com criadas, atualizadas, ignoradas e com erro.

Crie também uma opção **Reimportar somente o conteúdo do calendário**, sem duplicar publicações já importadas. Use uma chave única, por exemplo `campaignId + editorialDay + sequenceNumber + platform`, ou outro identificador estável apropriado.

## Calendário visual e sequência temporal

O calendário deve seguir rigorosamente as datas e horários definidos. Como padrão inicial, use os horários editoriais do plano:

| Horário | Canal | Função |
| --- | --- | --- |
| 07:30 | Instagram | Alcance, identificação e carrossel/Reel |
| 11:30 | TikTok | Gancho rápido e descoberta |
| 14:00 | Facebook | Explicação, comunidade e compartilhamento |
| 18:30 | YouTube | Short vertical e demonstração |
| 20:30 | Canal rotativo | Story, enquete, comunidade ou reforço |

O administrador deve poder alterar datas e horários individualmente ou em lote. Ao alterar uma data, mantenha a ordem editorial e apresente aviso caso exista conflito.

Implemente visualizações:

- Mês, com cards coloridos por plataforma.
- Semana, com horários em uma grade.
- Dia, com sequência vertical das cinco publicações.
- Lista, com filtros e ordenação.
- Próximas publicações.
- Publicações atrasadas.
- Histórico de publicadas.

Cada card de calendário deve mostrar imagem em miniatura, data, horário, plataforma, título resumido, status e ações rápidas.

## Tela de preparação para publicar

Ao abrir uma publicação, mostrar uma tela dedicada e limpa com a imagem grande, os metadados e os botões de cópia.

A tela deve conter, no mínimo:

```text
[Imagem da publicação]

Data e horário:
Plataforma:
Formato:
Pilar editorial:
Status:

Título:
[botão Copiar título]

Descrição:
[botão Copiar descrição]

Hashtags:
[botão Copiar hashtags]

Texto de engajamento:
[botão Copiar texto de engajamento]

CTA:
[botão Copiar CTA]

Link:
[botão Copiar link]

[botão Copiar publicação completa]
[botão Baixar imagem]
[botão Abrir imagem em nova aba]
[botão Marcar como publicada]
[botão Agendar lembrete]
```

O botão **Copiar publicação completa** deve montar o texto na ordem correta para cada plataforma:

```text
[TÍTULO]

[DESCRIÇÃO]

[HASHTAGS]

[TEXTO DE ENGAJAMENTO]

[CTA E LINK]
```

Depois de copiar, mostre uma confirmação visual, como “Copiado para a área de transferência”. Use a Clipboard API com fallback compatível para navegadores mais antigos.

Crie também botões independentes para copiar apenas título, descrição, hashtags, CTA, link e roteiro de vídeo. O conteúdo copiado deve preservar acentos, quebras de linha e emojis existentes no material original.

## Pré-visualização por plataforma

A publicação deve poder ser visualizada em modelos aproximados de Instagram, TikTok, Facebook e YouTube. O objetivo é verificar hierarquia, truncamento e leitura antes da cópia.

A prévia deve adaptar:

- Nome e ícone da plataforma.
- Formato vertical, quadrado ou horizontal.
- Imagem principal.
- Título ou primeira linha.
- Legenda/descrição.
- Hashtags.
- CTA.
- Link, quando aplicável.

Não invente novos textos na prévia. Utilize exatamente os campos salvos na publicação.

## Biblioteca de imagens e assets

Crie uma biblioteca de mídia dentro da central de divulgação. Ela deve catalogar:

| Recurso | Comportamento |
| --- | --- |
| Upload de imagem | Validar formato, tamanho, proporção e nome |
| Imagem existente | Reutilizar sem duplicar o arquivo físico desnecessariamente |
| Tags | Pessoas reais, mascote, dashboard, vendas, identidade, Instagram, TikTok, Facebook, YouTube |
| Busca | Por nome, campanha, plataforma, pilar ou tag |
| Filtros | Por proporção, formato, data e uso |
| Preview | Visualização ampliada |
| Download | Baixar o PNG/JPG original |
| Associação | Vincular a uma ou mais publicações |
| Substituição | Trocar o asset sem perder histórico |
| Exclusão | Impedir exclusão de imagem em uso ou exigir substituição prévia |
| Metadados | Nome, tipo, dimensões, tamanho, alt text, origem e hash |

Importe o acervo em `imagens_por_postagem/` e preserve os nomes sequenciais. Os arquivos-base estão associados a 450 postagens, usando 28 ativos visuais aprovados. O sistema deve deixar claro quando várias publicações usam o mesmo asset-base.

## Sincronização com calendário e lembretes

Implemente uma solução progressiva, segura e compatível com PWA para lembrar o administrador de publicar.

### Exportação para calendário do celular

Crie botões para:

- Exportar uma publicação para arquivo `.ics`.
- Exportar o dia inteiro.
- Exportar a semana.
- Exportar os 90 dias completos.
- Gerar link de download de calendário.
- Definir lembrete padrão, como 15 minutos antes.
- Escolher fuso horário `America/Sao_Paulo`.

O arquivo ICS deve conter título, plataforma, horário, descrição resumida, link para a publicação dentro do painel e link da landing page quando aplicável.

### Lembretes dentro do PWA

Implemente, quando suportado pelo navegador:

- Solicitação explícita de permissão para notificações.
- Lembrete da próxima publicação.
- Lembrete 15 minutos antes.
- Lembrete no horário.
- Lembrete de publicação atrasada.
- Lista de lembretes ativos.
- Pausar ou reativar lembretes.
- Configuração de antecedência.

Não prometa que um navegador fechado emitirá alarmes em todos os dispositivos. Quando a notificação em segundo plano não for suportada, ofereça exportação `.ics` e instruções para adicionar ao Google Calendar, Apple Calendar ou calendário nativo do celular.

### Integrações opcionais

Estruture a arquitetura para futuras integrações com Google Calendar, Microsoft Outlook, Google Tasks ou automação de redes sociais, mas não publique automaticamente em contas externas sem credenciais, consentimento e configuração explícita do administrador.

A primeira versão deve funcionar completamente com calendário interno, exportação `.ics`, notificações do navegador, cópia para área de transferência e download das imagens.

## Painel de links e banners oficiais

Crie dentro da nova aba um painel chamado **Canais oficiais e materiais de divulgação**. Ele deve mostrar um card para cada canal:

| Canal | Link oficial |
| --- | --- |
| Instagram | `https://www.instagram.com/meucorr` |
| TikTok | `https://www.tiktok.com/@meucorr` |
| YouTube | `https://youtube.com/@meucorre-z4j` |
| Facebook | `https://www.facebook.com/share/1QqGSn22NC/` |
| Aplicação MeuCorre | `https://meucorre.vercel.app/` |
| Diagnóstico | `https://meucorre.vercel.app/quiz` |

Cada card deve exibir:

- Nome e ícone da plataforma.
- Banner ou imagem de capa correspondente.
- Link completo.
- Botão **Abrir canal**.
- Botão **Copiar link**.
- Botão **Baixar banner**.
- Botão **Copiar texto de divulgação**.
- Status configurado ou pendente.
- Data da última atualização.

O painel também deve conter um card de divulgação da plataforma MeuCorre, usando os banners e imagens existentes. Esse card deve ter:

```text
Logo MeuCorre
Banner principal
Título de divulgação
Descrição curta
Benefícios principais
Link da aplicação
Link do diagnóstico
Botão Copiar texto completo
Botão Copiar link
Botão Baixar banner
```

Permita que o administrador edite os links, banners, textos e status dos canais via CRUD. Os links iniciais devem ser preenchidos com os valores acima, mas nunca ficar gravados como constantes espalhadas pelo código.

## Modelo de dados sugerido

Adapte os nomes ao padrão já utilizado no projeto. Se o projeto usa Prisma, crie migração segura e índices adequados.

### Campaign

```prisma
model Campaign {
  id              String        @id @default(cuid())
  name            String
  description     String?
  objective       String?
  startAt         DateTime
  endAt           DateTime
  timezone        String        @default("America/Sao_Paulo")
  status          String        @default("draft")
  color           String        @default("#10B981")
  defaultUtm      String?
  posts           PromotionPost[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}
```

### PromotionPost

```prisma
model PromotionPost {
  id                String       @id @default(cuid())
  campaignId        String
  campaign          Campaign     @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  editorialDay      Int
  sequenceNumber    Int
  publishAt         DateTime
  timezone          String       @default("America/Sao_Paulo")
  platform          String
  format            String
  pillar            String?
  title             String
  description       String
  hashtags          String
  engagementText    String?
  cta               String?
  destinationUrl    String?
  altText           String?
  videoScript       String?
  durationSeconds   Int?
  status            String       @default("draft")
  publishedAt       DateTime?
  notes             String?
  utmQuery          String?
  assetId           String?
  asset             PromotionAsset? @relation(fields: [assetId], references: [id], onDelete: SetNull)
  createdBy         String?
  updatedBy         String?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  @@unique([campaignId, editorialDay, sequenceNumber, platform])
  @@index([publishAt, status])
  @@index([platform, status])
}
```

### PromotionAsset

```prisma
model PromotionAsset {
  id             String           @id @default(cuid())
  name           String
  storageKey     String
  publicUrl      String
  mimeType       String
  width          Int?
  height         Int?
  fileSize       Int?
  altText        String?
  source         String?
  baseAssetName  String?
  tags           String?
  hash           String?
  posts          PromotionPost[]
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
}
```

### SocialChannel

```prisma
model SocialChannel {
  id             String   @id @default(cuid())
  name           String
  platform       String
  profileUrl     String
  bannerUrl      String?
  promoTitle     String?
  promoText      String?
  active         Boolean  @default(true)
  sortOrder      Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

### PromotionReminder

```prisma
model PromotionReminder {
  id           String   @id @default(cuid())
  postId       String
  remindAt     DateTime
  minutesBefore Int     @default(15)
  channel      String   @default("browser")
  status       String   @default("active")
  sentAt       DateTime?
  createdAt    DateTime @default(now())
}
```

## API e permissões

Crie rotas administrativas protegidas pela autenticação já existente. Sugestão de endpoints:

```text
GET    /api/admin/promotion/campaigns
POST   /api/admin/promotion/campaigns
PATCH  /api/admin/promotion/campaigns/:id
DELETE /api/admin/promotion/campaigns/:id

GET    /api/admin/promotion/posts
POST   /api/admin/promotion/posts
PATCH  /api/admin/promotion/posts/:id
DELETE /api/admin/promotion/posts/:id
POST   /api/admin/promotion/posts/import
POST   /api/admin/promotion/posts/bulk-update
POST   /api/admin/promotion/posts/:id/duplicate
POST   /api/admin/promotion/posts/:id/mark-published
GET    /api/admin/promotion/posts/:id/ics
GET    /api/admin/promotion/calendar.ics

GET    /api/admin/promotion/assets
POST   /api/admin/promotion/assets
PATCH  /api/admin/promotion/assets/:id
DELETE /api/admin/promotion/assets/:id
POST   /api/admin/promotion/assets/import

GET    /api/admin/promotion/channels
POST   /api/admin/promotion/channels
PATCH  /api/admin/promotion/channels/:id
DELETE /api/admin/promotion/channels/:id

GET    /api/admin/promotion/reminders
POST   /api/admin/promotion/reminders
PATCH  /api/admin/promotion/reminders/:id
DELETE /api/admin/promotion/reminders/:id
```

Valide autenticação, autorização, parâmetros, URLs externas, tipos de imagem, tamanho de upload, filtros e paginação no servidor. Não confie em dados enviados pelo cliente. Mantenha logs de ações administrativas importantes, especialmente importação, exclusão, alteração de data, substituição de imagem e marcação como publicada.

## Experiência de uso esperada

O fluxo principal deve ser:

1. O administrador acessa **Administração → Divulgação**.
2. Visualiza a próxima postagem no painel.
3. Abre o card da publicação.
4. Confere imagem, data, horário, plataforma e prévia.
5. Clica em **Copiar publicação completa**.
6. Clica em **Baixar imagem** ou usa a imagem já disponível.
7. Abre a rede social pelo botão correspondente.
8. Cola o conteúdo, publica manualmente e retorna ao painel.
9. Clica em **Marcar como publicada**.
10. O sistema registra data, hora, usuário administrativo e observação opcional.

Inclua também o fluxo de copiar somente a descrição, somente hashtags e somente o link, pois isso é útil quando a rede social exige campos separados.

## Acessibilidade, segurança e qualidade

Use labels adequados, foco visível, navegação por teclado, contraste suficiente, textos alternativos nas imagens, feedback para cópia, estados de loading, estados vazios, mensagens de erro e confirmação para ações destrutivas.

Não exponha credenciais de redes sociais, tokens, cookies, secrets ou variáveis de ambiente no navegador. Não faça publicação automática em redes sociais sem integração autorizada. Não envie conteúdo para contas externas sem ação explícita do administrador.

Implemente paginação, busca com debounce, filtros no servidor quando necessário, cache apropriado, carregamento progressivo de imagens, lazy loading e compressão somente quando não houver perda relevante de qualidade.

## Testes obrigatórios

Crie testes unitários, de integração e, quando já houver Playwright, testes E2E para os seguintes cenários:

| Cenário | Critério de aceite |
| --- | --- |
| Acesso sem autenticação | Usuário não autenticado não consegue abrir a central |
| Importação | As 450 publicações são importadas sem duplicação |
| Associação de assets | As 450 publicações possuem uma imagem existente |
| Ordem | A sequência M01-D01-P01 até M03-D30-P05 é preservada |
| Filtros | Plataforma, status, mês e pilar filtram corretamente |
| CRUD | Criar, editar, duplicar, arquivar, restaurar e excluir funcionam |
| Cópia | Cada botão copia o campo correto e mostra confirmação |
| Cópia completa | O texto preserva ordem, quebras de linha, hashtags e CTA |
| Download | A imagem correta é baixada com nome legível |
| Calendário | A exportação ICS possui horário, fuso e descrição corretos |
| Lembretes | O sistema trata permissão, ativação, pausa e fallback para ICS |
| Links oficiais | Canais e banners podem ser editados e copiados |
| Mobile | O fluxo principal funciona em largura de celular |
| Segurança | Rotas administrativas e uploads são validados no servidor |
| Regressão | Build, lint, typecheck e testes existentes continuam passando |

## Critérios de aceite da entrega

A tarefa só estará concluída quando:

- A nova aba **Divulgação** estiver disponível dentro do painel admin.
- O calendário dos 90 dias estiver importado e ordenado.
- Existirem 450 publicações no banco, sem duplicações.
- Cada publicação possuir título, descrição, hashtags, CTA, data, horário, plataforma e imagem.
- O administrador conseguir copiar qualquer campo individual ou a publicação completa.
- O administrador conseguir baixar ou abrir a imagem correta.
- A tela mostrar claramente qual imagem pertence a cada descrição.
- Os filtros e o CRUD completo funcionarem.
- A exportação ICS estiver disponível para uma publicação, um dia, uma semana e todo o calendário.
- Os lembretes internos e a alternativa de calendário do celular estiverem disponíveis.
- O painel mostrar banners e links oficiais das quatro redes sociais e da aplicação.
- O layout respeitar a identidade visual existente e funcionar no celular.
- A implementação não quebrar as funcionalidades administrativas atuais.
- Build, lint, typecheck, migrações e testes passarem sem erros.

Ao final, entregue um resumo técnico das alterações, a lista de arquivos modificados, as migrações criadas, os comandos executados, os testes realizados e as instruções para importar ou atualizar o calendário de divulgação.

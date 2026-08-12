# Baseline de QA — MeuCorre

> Matriz de teste manual do estado atual do produto.
> Deve ser executada antes de qualquer implementação para estabelecer baseline de regressão.
> Cada teste deve ser marcado como ✅ (passou) ou ❌ (falhou) com observações.

---

## 1. Landing Page (/)

| # | Cenário | Passos | Resultado esperado | Status |
|---|---------|--------|-------------------|--------|
| 1.1 | Landing carrega | Abrir `https://meucorre.vercel.app/` | Página carrega com hero dark, headline, features | ✅ |
| 1.2 | Botão "Baixar grátis" redireciona | Clicar no botão "Baixar grátis" | Redireciona para `/app` | ✅ |
| 1.3 | Botão "Quero PRO" abre checkout | Clicar no botão "Quero PRO" | Abre dialog de checkout | ✅ |
| 1.4 | Quiz acessível | Navegar para `/quiz` | Quiz carrega com 4 perguntas | ✅ |
| 1.5 | Quiz cria conta + trial | Completar quiz + preencher form | Conta criada, trial 14 dias ativo | ✅ |
| 1.6 | Blog carrega | Navegar para `/blog` | Lista de posts aparece | ✅ |
| 1.7 | Capacetes F1 no rodapé | Rolar até o final da landing | 4 capacetes alinhados horizontalmente com nomes coloridos | ✅ |
| 1.8 | Redes sociais links corretos | Clicar em cada capacete | Abre: YouTube @meucorre-z4j, Instagram @meucorr, TikTok @meucorr, Facebook share/1QqGSn22NC | ✅ |

## 2. App do Entregador (/app)

| # | Cenário | Passos | Resultado esperado | Status |
|---|---------|--------|-------------------|--------|
| 2.1 | Dashboard carrega | Abrir `/app` | Dashboard premium com hero card de lucro + grid 2x2 | ✅ |
| 2.2 | Lançar corrida | Clicar FAB + → selecionar app → valor → km → lançar | Corrida aparece na lista, ganhos atualizam | ✅ |
| 2.3 | Lançar despesa | Aba Despesas → FAB → categoria → valor → lançar | Despesa aparece, lucro líquido atualiza | ✅ |
| 2.4 | Gráficos renderizam | Aba Gráficos | 3 gráficos: área, pizza, barras | ✅ |
| 2.5 | Corre do dia — iniciar | Clicar "Iniciar corre" | Status "EM ANDAMENTO", cronômetro rodando | ✅ |
| 2.6 | Corre do dia — finalizar | Clicar "Finalizar corre" → confirmar | Sessão salva, "CORRES HOJE: 1" | ✅ |
| 2.7 | Metas — criar | Clicar "Nova meta" → preencher → criar | Meta criada com barra de progresso | ✅ |
| 2.8 | Mapa de calor — abrir | Clicar "Mapa de calor" | Mapa Leaflet carrega, mostra localização | ✅ |
| 2.9 | Onboarding — reabrir | Menu → "Tutorial do app" | Onboarding 9 passos abre | ✅ |
| 2.10 | Exportar JSON | Menu → "Exportar JSON" | Arquivo JSON baixado | ✅ |
| 2.11 | Exportar CSV | Menu → "Exportar CSV" | Arquivo CSV baixado | ✅ |
| 2.12 | Funciona offline | Desligar internet → lançar corrida | Corrida salva localmente | ✅ |

## 3. Autenticação

| # | Cenário | Passos | Resultado esperado | Status |
|---|---------|--------|-------------------|--------|
| 3.1 | Login user | `/login` → email + senha | Login redireciona para `/app` | ✅ |
| 3.2 | Registro user | `/register` → preencher → registrar | Conta criada, redirect para `/app` | ✅ |
| 3.3 | Recuperar senha | `/recuperar-senha` → email | Email enviado (se configurado) | ✅ |
| 3.4 | Login admin | `/admin/login` → email + senha | Redirect para `/admin/dashboard` | ✅ |
| 3.5 | Auth /api/auth/me | GET com cookie | Retorna dados do usuário logado | ✅ |
| 3.6 | Logout | Menu → "Sair da conta" | Cookie removido, redirect para `/` | ✅ |

## 4. Painel Admin (/admin)

| # | Cenário | Passos | Resultado esperado | Status |
|---|---------|--------|-------------------|--------|
| 4.1 | Dashboard admin | `/admin/dashboard` | Mostra receita, vendas, CTR, rating | ✅ |
| 4.2 | Anúncios CRUD | `/admin/ads` → criar, editar, excluir | CRUD funciona, anúncio aparece no app | ✅ |
| 4.3 | Assinaturas | `/admin/subscriptions` → aprovar/rejeitar | Status muda, licença gerada | ✅ |
| 4.4 | Usuários | `/admin/users` → listar, toggle PRO | Lista carrega, toggle funciona | ✅ |
| 4.5 | Ofertas | `/admin/offers` → CRUD | CRUD funciona | ✅ |
| 4.6 | Blog | `/admin/blog` → criar post | Post criado, pop-up Blogger aparece | ✅ |
| 4.7 | Blogger publish | Clicar "Publicar no Blogger" | Post publicado no Blogger (se autorizado) | ✅ |
| 4.8 | Feedbacks | `/admin/feedback` → listar, filtrar | Lista carrega, filtros funcionam | ✅ |
| 4.9 | Indicações | `/admin/referrals` → listar, pagar | Lista carrega, marcação funciona | ✅ |

## 5. APIs

| # | Cenário | Método + Endpoint | Resultado esperado | Status |
|---|---------|-------------------|-------------------|--------|
| 5.1 | Health check | GET `/api/health` | `{"status":"healthy"}` | ✅ |
| 5.2 | Ads público | GET `/api/ads?placement=banner_top` | Lista de anúncios ativos | ✅ |
| 5.3 | Blog público | GET `/api/blog` | Lista de posts publicados | ✅ |
| 5.4 | Quiz submit | POST `/api/quiz/submit` | `{"ok":true,"result":{...}}` | ✅ |
| 5.5 | Lifetime status | GET `/api/lifetime-status` | `{"available":true}` | ✅ |
| 5.6 | Sync (sem auth) | GET `/api/sync` | 401 Não autorizado | ✅ |
| 5.7 | Admin (sem auth) | GET `/api/admin/dashboard` | 401 Não autorizado | ✅ |

## 6. PWA

| # | Cenário | Passos | Resultado esperado | Status |
|---|---------|--------|-------------------|--------|
| 6.1 | Manifest válido | Abrir `https://meucorre.vercel.app/manifest.json` | JSON válido com ícones | ✅ |
| 6.2 | Service Worker | DevTools → Application → Service Workers | SW registrado, status activated | ✅ |
| 6.3 | Instalável (Android) | Chrome Android → menu → Instalar app | PWA instalável | ✅ |
| 6.4 | Offline | Desligar internet → abrir app | App abre com dados locais | ✅ |

## 7. Pagamentos

| # | Cenário | Passos | Resultado esperado | Status |
|---|---------|--------|-------------------|--------|
| 7.1 | Checkout dialog | Clicar "Quero PRO" | Dialog com 3 planos (mensal/anual/vitalício) | ✅ |
| 7.2 | Redirect Kiwify | Preencher form → submeter | Redireciona para `pay.kiwify.com.br` | ✅ |
| 7.3 | Webhook Kiwify | POST `/api/webhooks/kiwify` com token | Valida token, cria assinatura | ✅ |
| 7.4 | Verificar licença | POST `/api/license/verify` | Valida licença PRO | ✅ |

## 8. Indicação

| # | Cenário | Passos | Resultado esperado | Status |
|---|---------|--------|-------------------|--------|
| 8.1 | Gerar código | GET `/api/referral/code` (logado PRO) | Retorna código único | ✅ |
| 8.2 | Registrar indicação | POST `/api/referral/register` | Vincula código ao novo usuário | ✅ |
| 8.3 | Stats indicação | GET `/api/referral/stats` | Retorna total, converted, paid | ✅ |
| 8.4 | Admin indicações | GET `/api/admin/referrals` | Lista todas as indicações | ✅ |

---

> **Baseline executada em:** 12 de agosto de 2026
> **Ambiente:** Produção (https://meucorre.vercel.app)
> **Versão:** Commit `7d77281`
> **Resultado:** Todos os testes ✅ — baseline estabelecido

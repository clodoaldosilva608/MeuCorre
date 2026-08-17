#!/bin/bash
# ===== Script de Deploy Vercel + Configuração de Env Vars =====
#
# Uso:
#   VERCEL_TOKEN=seu_token_aqui bash scripts/vercel-deploy.sh
#
# Obtém o token em: https://vercel.com/account/tokens
#
# Este script:
# 1. Configura todas as variáveis de ambiente necessárias
# 2. Dispara um deploy de produção
# 3. Aguarda o deploy concluir
# 4. Valida que o novo código está no ar

set -euo pipefail

# ===== 0. Validar token =====
if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "❌ ERRO: VERCEL_TOKEN não definido"
  echo "   Obtenha um token em: https://vercel.com/account/tokens"
  echo "   Uso: VERCEL_TOKEN=xxx bash scripts/vercel-deploy.sh"
  exit 1
fi

PROJECT_ID="prj_Me8PGtKs45bUykxkfLWANPAAULuN"
ORG_ID="team_iylYgr5VwMOCi7FtolZSwtcO"
PROJECT_NAME="meucorre"
BASE_URL="https://meucorre.vercel.app"

echo "=========================================="
echo "  Deploy MeuCorre para Vercel"
echo "=========================================="
echo "Project: $PROJECT_NAME ($PROJECT_ID)"
echo "Org:     $ORG_ID"
echo ""

# ===== 1. Configurar variáveis de ambiente =====
# NOTA: Os valores abaixo são PLACEHOLDERS — substitua pelos valores reais
# antes de executar o script.
#
# SENTRY_DSN: obtém em https://sentry.io/settings/<org>/projects/<project>/keys/
# KIWIFY_WEBHOOK_SECRET: configura no dashboard da Kiwify → Integrações → Webhook
# KIWIFY_PRODUCT_ID: obtém no dashboard da Kiwify → Produto → ID
# NEXT_PUBLIC_KIWIFY_PRODUCT_SLUG: o slug do produto na URL de checkout
#   (ex: pay.kiwify.com.br/SLUG → SLUG é o valor)
# PLAN_PRICE: 18.9 (preço de lançamento atual)

declare -A ENV_VARS=(
  ["SENTRY_DSN"]="${SENTRY_DSN:-}"
  ["KIWIFY_WEBHOOK_SECRET"]="${KIWIFY_WEBHOOK_SECRET:-}"
  ["KIWIFY_PRODUCT_ID"]="${KIWIFY_PRODUCT_ID:-}"
  ["NEXT_PUBLIC_KIWIFY_PRODUCT_SLUG"]="${NEXT_PUBLIC_KIWIFY_PRODUCT_SLUG:-bknZCSZ}"
  ["PLAN_PRICE"]="18.9"
  ["USER_JWT_SECRET"]="${USER_JWT_SECRET:-$(openssl rand -hex 32)}"
  ["ADMIN_JWT_SECRET"]="${ADMIN_JWT_SECRET:-$(openssl rand -hex 32)}"
  ["ADMIN_PASSWORD"]="${ADMIN_PASSWORD:?ADMIN_PASSWORD must be set}"
)

echo "=== 1. Configurando variáveis de ambiente ==="
for key in "${!ENV_VARS[@]}"; do
  value="${ENV_VARS[$key]}"
  if [ -z "$value" ]; then
    echo "  ⚠️  $key não definido — pulando (configure manualmente)"
    continue
  fi

  # Determina se é sensível (não exposta ao client) ou pública
  if [[ "$key" == NEXT_PUBLIC_* ]]; then
    target="production preview development"
  else
    target="production"
  fi

  echo "  Configurando $key..."

  # Remove variável existente (se houver) antes de criar
  curl -s -X DELETE \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    "https://api.vercel.com/v9/projects/$PROJECT_ID/env/$key?teamId=$ORG_ID" \
    > /dev/null 2>&1 || true

  # Cria nova variável
  RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    "https://api.vercel.com/v9/projects/$PROJECT_ID/env?teamId=$ORG_ID" \
    -d "{\"key\":\"$key\",\"value\":\"$value\",\"type\":\"encrypted\",\"target\":[\"$target\"]}" 2>&1)

  if echo "$RESPONSE" | grep -q '"key"'; then
    echo "    ✓ $key configurado"
  else
    echo "    ⚠️  Erro ao configurar $key: $(echo "$RESPONSE" | head -c 100)"
  fi
done

echo ""

# ===== 2. Disparar deploy de produção via GitHub source =====
echo "=== 2. Disparando deploy de produção ==="
DEPLOY_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.vercel.com/v13/deployments?teamId=$ORG_ID" \
  -d "{
    \"name\": \"$PROJECT_NAME\",
    \"project\": \"$PROJECT_ID\",
    \"target\": \"production\",
    \"gitSource\": {
      \"type\": \"github\",
      \"org\": \"clodoaldosilva608\",
      \"repo\": \"MeuCorre\",
      \"ref\": \"main\"
    }
  }" 2>&1)

DEPLOY_ID=$(echo "$DEPLOY_RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('id',''))" 2>&1)
DEPLOY_URL=$(echo "$DEPLOY_RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('url',''))" 2>&1)

if [ -z "$DEPLOY_ID" ] || [ "$DEPLOY_ID" = "" ]; then
  echo "❌ Erro ao disparar deploy:"
  echo "$DEPLOY_RESPONSE" | head -5
  exit 1
fi

echo "  Deploy ID: $DEPLOY_ID"
echo "  URL temporária: https://$DEPLOY_URL"
echo ""

# ===== 3. Aguardar deploy concluir =====
echo "=== 3. Aguardando deploy concluir (até 5 min) ==="
for i in $(seq 1 30); do
  sleep 10
  STATUS=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
    "https://api.vercel.com/v13/deployments/$DEPLOY_ID?teamId=$ORG_ID" 2>&1 | \
    python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('status','?'))" 2>&1)
  echo "  [$i/30] Status: $STATUS"

  if [ "$STATUS" = "READY" ]; then
    echo "  ✅ Deploy concluído!"
    break
  fi

  if [ "$STATUS" = "ERROR" ] || [ "$STATUS" = "CANCELED" ]; then
    echo "  ❌ Deploy falhou: $STATUS"
    exit 1
  fi
done

echo ""

# ===== 4. Validar produção =====
echo "=== 4. Validando produção ==="
sleep 5
PROD_RESULT=$(curl -s "$BASE_URL/?cb=$(date +%s%N)" 2>&1)
if echo "$PROD_RESULT" | grep -q '<button[^>]*>Comprar</button>'; then
  echo "  ✅ Novo código está no ar! Botão 'Comprar' encontrado no header."
elif echo "$PROD_RESULT" | grep -q 'href="#planos"'; then
  echo "  ⚠️  Produção ainda mostra código antigo (pode ser cache CDN — aguarde 1 min)"
else
  echo "  ⚠️  Não foi possível validar o conteúdo da produção"
fi

echo ""
echo "=========================================="
echo "  Deploy concluído!"
echo "  URL: $BASE_URL"
echo "=========================================="
echo ""
echo "Próximos passos:"
echo "  1. Teste manual: acesse $BASE_URL"
echo "  2. Rode E2E tests: BASE_URL=$BASE_URL npx playwright test"
echo ""

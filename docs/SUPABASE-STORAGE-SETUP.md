# Configuração de Armazenamento — Supabase Storage

## Visão Geral

O MeuCorre usa **Supabase Storage** para armazenar imagens de forma persistente (CDN global, URLs públicas permanentes). Se o Supabase não estiver configurado, o sistema faz fallback para filesystem local (que **não persiste** em Vercel serverless).

## Configuração (5 minutos)

### 1. Obter credenciais do Supabase

1. Acesse: https://supabase.com/dashboard/project/PROJECT_REF/settings/api
2. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** secret → `SUPABASE_SERVICE_ROLE_KEY` (NUNCA exponha no client)

### 2. Criar bucket público

1. Acesse: https://supabase.com/dashboard/project/PROJECT_REF/storage/buckets
2. Clique em **"New bucket"**
3. Configure:
   - **Name**: `promotion-assets`
   - **Public bucket**: ✅ YES (marcar)
   - **Allowed MIME types**: `image/png, image/jpeg, image/webp, image/gif`
   - **File size limit**: `10 MB`

### 3. Configurar variáveis de ambiente

Na Vercel: https://vercel.com/meucorre/settings/environment-variables

```
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Também no `.env` local:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Deploy

Após configurar as env vars, faça um novo deploy. O sistema detecta automaticamente o Supabase e passa a usar Storage.

## Como Funciona

```
Upload de imagem (.tar.gz extraído no navegador)
         ↓
   API /api/admin/promotion/assets/upload
         ↓
   ┌─────────────────────────────────────┐
   │ Supabase Storage configurado?       │
   └─────────────────────────────────────┘
      ↓ SIM                    ↓ NÃO
   Upload para Supabase       Salva em public/promotion/
   Bucket: promotion-assets   (não persiste em serverless)
   URL: https://PROJECT       URL: /promotion/file.png
        .supabase.co/storage
        /v1/object/public/
        promotion-assets/...
         ↓                          ↓
   Atualiza PromotionAsset no banco (publicUrl + storageKey)
```

## Verificação

Após configurar, acesse a página de upload:
https://meucorre.vercel.app/admin/divulgacao/upload-batch

Ao fazer o primeiro upload, aparecerá um indicador:
- ✅ **Verde**: "Supabase Storage (CDN persistente)" — configurado corretamente
- ⚠️ **Âmbar**: "Filesystem local (não persistente)" — configure o Supabase

## Limites

| Recurso | Supabase Free | Supabase Pro |
|---------|---------------|--------------|
| Storage | 1 GB | 100 GB |
| Bandwidth | 2 GB | 250 GB |
| File size | 50 MB | 5 GB |

## Backup Adicional — GitHub (opcional)

Para backup das imagens no GitHub (além do Supabase):

1. Clone o repositório localmente
2. Copie as imagens para `public/promotion/`
3. Faça commit + push

As imagens ficam versionadas no Git e servidas pelo Vercel CDN.

**Nota**: GitHub tem limite de 100 MB por arquivo e 1 GB por repositório (free). Use apenas para backup, não como storage principal.

## Troubleshooting

### Erro: "Bucket não existe"
Crie o bucket `promotion-assets` manualmente em Storage → New bucket (marcar "Public").

### Erro: "service_role key inválida"
Verifique se copiou a chave `service_role` (não a `anon` key). A `service_role` bypassa RLS.

### Imagens não aparecem após deploy
Se estiver usando filesystem local (sem Supabase), as imagens são perdidas a cada deploy. Configure o Supabase Storage.

### URLs quebradas (404)
Verifique se o bucket é público. URLs públicas têm formato:
`https://PROJECT_REF.supabase.co/storage/v1/object/public/promotion-assets/promotion/file.png`

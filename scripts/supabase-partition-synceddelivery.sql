-- ===== P3-1: Particionamento de SyncedDelivery por mês =====
--
-- Divide a tabela SyncedDelivery (que cresce linearmente com uso)
-- em partições mensais. Em 50k usuários × 500 corridas/ano = 25M rows,
-- queries com WHERE date >= X ficam 10-100x mais rápidas (índice local
-- à partição em vez de índice global).
--
-- Prisma não gerencia particionamento nativamente, então criamos
-- via SQL raw. O Prisma consegue ler/escrever na tabela particionada
-- normalmente — para ele, é só uma tabela.
--
-- PRÉ-REQUISITOS:
-- - PostgreSQL 15+ (declarative partitioning melhorado)
-- - Supabase Pro ou superior (suporta pg_cron para criar partições
--   mensais automaticamente)
--
-- EXECUTAR EM PRODUÇÃO (Supabase SQL Editor):
-- 1. Faça backup primeiro (pg_dump ou export via /api/cron/backup)
-- 2. Execute este script
-- 3. Configure pg_cron job para criar partições futuras (script abaixo)

-- ========================================
-- PASSO 1: Backup da tabela original
-- ========================================
-- Se algo der errado, podemos restaurar.

CREATE TABLE IF NOT EXISTS "SyncedDelivery_backup" AS
  SELECT * FROM "SyncedDelivery";

-- ========================================
-- PASSO 2: Dropar FKs que referenciam SyncedDelivery
-- ========================================
-- (provavelmente nenhuma, mas verificar)

-- Verificar FKs:
-- SELECT conname, conrelid::regclass AS table_from, confrelid::regclass AS table_to
-- FROM pg_constraint WHERE confrelid = '"SyncedDelivery"'::regclass;

-- ========================================
-- PASSO 3: Renomear tabela original
-- ========================================
ALTER TABLE "SyncedDelivery" RENAME TO "SyncedDelivery_old";

-- ========================================
-- PASSO 4: Criar tabela particionada
-- ========================================
-- PARTITION BY RANGE (date) — particiona pelo campo date (YYYY-MM-DD)
-- Cada partição contém dados de um mês.

CREATE TABLE "SyncedDelivery" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "localId" INTEGER NOT NULL,
  "app" TEXT NOT NULL,
  "value" DECIMAL(65,30) NOT NULL,
  "km" DECIMAL(65,30) NOT NULL,
  "date" TEXT NOT NULL,
  "timestamp" BIGINT NOT NULL,
  "notes" TEXT,
  "updatedAt" BIGINT NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "SyncedDelivery_pkey" PRIMARY KEY (id, date)
) PARTITION BY RANGE ("date");

-- ========================================
-- PASSO 5: Criar índices na tabela particionada
-- ========================================
-- Índices em tabela particionada são criados na partição-mãe e
-- propagados automaticamente para todas as partições.

CREATE INDEX "SyncedDelivery_userId_localId_idx"
  ON "SyncedDelivery" ("userId", "localId");

CREATE INDEX "SyncedDelivery_userId_updatedAt_idx"
  ON "SyncedDelivery" ("userId", "updatedAt");

CREATE INDEX "SyncedDelivery_userId_date_idx"
  ON "SyncedDelivery" ("userId", "date");

CREATE INDEX "SyncedDelivery_userId_deleted_idx"
  ON "SyncedDelivery" ("userId", "deleted");

CREATE UNIQUE INDEX "SyncedDelivery_userId_localId_key"
  ON "SyncedDelivery" ("userId", "localId");

-- ========================================
-- PASSO 6: Criar partições mensais retroativas
-- ========================================
-- Cria partições para os últimos 6 meses + próximos 6 meses.
-- Para dados mais antigos, vão para a partição "default" (se criada).

-- Função helper para criar partição mensal
CREATE OR REPLACE FUNCTION create_monthly_partition(
  year_month TEXT  -- formato: '2026-08'
) RETURNS VOID AS $$
DECLARE
  start_date DATE;
  end_date DATE;
  partition_name TEXT;
BEGIN
  start_date := TO_DATE(year_month || '-01', 'YYYY-MM-DD');
  end_date := start_date + INTERVAL '1 month';

  partition_name := 'SyncedDelivery_' || REPLACE(year_month, '-', '_');

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF "SyncedDelivery" FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_date, end_date
  );

  RAISE NOTICE 'Created partition %', partition_name;
END;
$$ LANGUAGE plpgsql;

-- Cria partições para os últimos 6 meses + próximos 6 meses
SELECT create_monthly_partition(TO_CHAR(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months'), 'YYYY-MM'));
SELECT create_monthly_partition(TO_CHAR(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '4 months'), 'YYYY-MM'));
SELECT create_monthly_partition(TO_CHAR(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months'), 'YYYY-MM'));
SELECT create_monthly_partition(TO_CHAR(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months'), 'YYYY-MM'));
SELECT create_monthly_partition(TO_CHAR(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 months'), 'YYYY-MM'));
SELECT create_monthly_partition(TO_CHAR(DATE_TRUNC('month', CURRENT_DATE), 'YYYY-MM'));
SELECT create_monthly_partition(TO_CHAR(DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month'), 'YYYY-MM'));
SELECT create_monthly_partition(TO_CHAR(DATE_TRUNC('month', CURRENT_DATE + INTERVAL '2 months'), 'YYYY-MM'));
SELECT create_monthly_partition(TO_CHAR(DATE_TRUNC('month', CURRENT_DATE + INTERVAL '3 months'), 'YYYY-MM'));
SELECT create_monthly_partition(TO_CHAR(DATE_TRUNC('month', CURRENT_DATE + INTERVAL '4 months'), 'YYYY-MM'));
SELECT create_monthly_partition(TO_CHAR(DATE_TRUNC('month', CURRENT_DATE + INTERVAL '5 months'), 'YYYY-MM'));

-- Partição default para dados fora do range (ex: data inválida ou futura)
-- Dados entram aqui se nenhuma partição mensal bater.
-- IMPORTANTE: não usar para dados quentes — sempre criar partição mensal.
CREATE TABLE IF NOT EXISTS "SyncedDelivery_default"
  PARTITION OF "SyncedDelivery" DEFAULT;

-- ========================================
-- PASSO 7: Migrar dados da tabela antiga
-- ========================================
-- Move todos os registros da tabela antiga para a nova particionada.
-- Pode demorar alguns minutos dependendo do volume.

INSERT INTO "SyncedDelivery" (
  "id", "userId", "localId", "app", "value", "km", "date",
  "timestamp", "notes", "updatedAt", "deleted"
)
SELECT
  "id", "userId", "localId", "app", "value", "km", "date",
  "timestamp", "notes", "updatedAt", "deleted"
FROM "SyncedDelivery_old";

-- ========================================
-- PASSO 8: Dropar tabela antiga (após verificação)
-- ========================================
-- DESCOMENTE APENAS APÓS VERIFICAR QUE TUDO ESTÁ OK
-- DROP TABLE "SyncedDelivery_old";

-- ========================================
-- PASSO 9: Configurar pg_cron para criar partições futuras
-- ========================================
-- Supabase Pro+ tem pg_cron extension. Cria job mensal que cria
-- a partição do mês seguinte automaticamente.

-- Habilitar pg_cron (se ainda não estiver)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Job mensal: cria partição para o mês seguinte
-- Roda no dia 1 de cada mês às 03:00
SELECT cron.schedule(
  'create_synceddelivery_partition_monthly',
  '0 3 1 * *',
  $$
    SELECT create_monthly_partition(
      TO_CHAR(DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month'), 'YYYY-MM')
    );
  $$
);

-- ========================================
-- VERIFICAÇÃO
-- ========================================
-- Liste as partições criadas:
-- SELECT tablename FROM pg_tables WHERE tablename LIKE 'SyncedDelivery_%' ORDER BY tablename;

-- Verifique contagem:
-- SELECT COUNT(*) FROM "SyncedDelivery";
-- SELECT COUNT(*) FROM "SyncedDelivery_backup";

-- Se os números baterem, drop o backup:
-- DROP TABLE "SyncedDelivery_backup";

-- ========================================
-- ROLLBACK (em caso de problema)
-- ========================================
-- Para reverter:
-- 1. DROP TABLE "SyncedDelivery" CASCADE;
-- 2. ALTER TABLE "SyncedDelivery_old" RENAME TO "SyncedDelivery";
-- 3. Recriar índices (ver schema.prisma para referência)

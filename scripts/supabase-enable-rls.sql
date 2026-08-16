-- =====================================================================
-- MeuCorre — Row Level Security (RLS) no Supabase
-- =====================================================================
-- RLS desligado é a vulnerabilidade #1 em apps vibe-coded.
-- Com RLS desligado, qualquer um com a anon key consegue ler/escrever
-- em qualquer tabela via Supabase client no navegador.
--
-- Este script HABILITA RLS em todas as tabelas públicas e cria policies
-- negativas por default (ninguém acessa nada via Supabase client direto).
--
-- Como o MeuCorre usa Prisma (server-side) para acessar o banco com a
-- service_role key (que pula RLS), as policies restritivas não afetam
-- a aplicação — só impedem acesso direto do navegador do cliente.
--
-- EXECUTE NO: Supabase Dashboard → SQL Editor → New query
-- =====================================================================

-- 1. Habilita RLS + FORCE em TODAS as tabelas do schema public

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', tbl);
    RAISE NOTICE 'RLS habilitado em: %', tbl;
  END LOOP;
END $$;

-- 2. Cria policies restritivas (deny all) para todas as tabelas
--    Como o app usa Prisma com service_role (que pula RLS),
--    essas policies só afetam acesso direto via Supabase client (anon key)
--    que NÃO é usado pelo app em produção.

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    -- Remove policies existentes (se houver)
    EXECUTE format('DROP POLICY IF EXISTS "deny_all_anon_%s" ON public.%I;', tbl, tbl);
    -- Cria policy que bloqueia tudo para anon
    EXECUTE format(
      'CREATE POLICY "deny_all_anon_%s" ON public.%I FOR ALL USING (false) WITH CHECK (false);',
      tbl, tbl
    );
    RAISE NOTICE 'Policy criada em: %', tbl;
  END LOOP;
END $$;

-- 3. Verificação final — usa pg_class que tem a coluna relrowsecurity
--    (pg_tables não expõe force RLS em algumas versões do Postgres)

SELECT
  c.relname AS tablename,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relname;

-- =====================================================================
-- Resultado esperado:
--   43 tabelas com rls_enabled = true e rls_forced = true
--
-- Para acessar dados no app, use:
--   - Prisma Client (server-side, com service_role) → pula RLS, funciona normal
--   - Supabase client (browser) → bloqueado por padrão
-- =====================================================================

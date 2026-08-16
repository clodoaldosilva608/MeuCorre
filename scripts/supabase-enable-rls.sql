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

-- 1. Habilita RLS em TODAS as tabelas do schema public
--    (uma linha por tabela — não use wildcard porque pode falhar em tabelas do sistema)

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

-- Para cada tabela, cria policy "deny all" — bloqueia SELECT/INSERT/UPDATE/DELETE
-- para usuários anônimos. Acesso real vem via Prisma (server-side).

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    -- Remove policies existentes (se houver)
    EXECUTE format('DROP POLICY IF EXISTS "deny_all_anon_%s" ON public.%I;', tbl, tbl);
    -- Cria policy que bloqueia tudo para anon (sem cláusula USING = sempre false)
    -- Como FORCED RLS está ativo, mesmo o owner precisa de policy
    -- Mas service_role pula RLS, então app continua funcionando
    EXECUTE format(
      'CREATE POLICY "deny_all_anon_%s" ON public.%I FOR ALL USING (false) WITH CHECK (false);',
      tbl, tbl
    );
    RAISE NOTICE 'Policy criada em: %', tbl;
  END LOOP;
END $$;

-- 3. Verificação final — lista status de RLS por tabela
SELECT
  tablename,
  rowsecurity AS rls_enabled,
  forcerowsecurity AS rls_forced
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================================
-- Resultado esperado:
--   Todas as tabelas com rls_enabled = true e rls_forced = true
--
-- Para acessar dados no app, use:
--   - Prisma Client (server-side, com service_role) → pula RLS, funciona normal
--   - Supabase client (browser) → bloqueado por padrão
--
-- Se precisar liberar leitura pública para alguma tabela (ex: Ads),
-- crie uma policy específica:
--
--   DROP POLICY IF EXISTS "deny_all_anon_Ad" ON public."Ad";
--   CREATE POLICY "read_active_ads" ON public."Ad"
--     FOR SELECT USING (active = true);
-- =====================================================================

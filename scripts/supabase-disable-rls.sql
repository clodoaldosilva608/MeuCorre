-- =====================================================================
-- MeuCorre — DESABILITAR RLS (ROLLBACK)
-- =====================================================================
-- Use este script APENAS se habilitar o RLS quebrar a aplicação.
-- Ele remove todas as policies e desabilita RLS em todas as tabelas.
--
-- AVISO: Voltar ao estado anterior (RLS desligado) deixa o banco
-- vulnerável — qualquer um com a anon key consegue ler/escrever tudo.
-- Use apenas temporariamente para diagnóstico.
--
-- EXECUTE NO: Supabase Dashboard → SQL Editor → New query
-- =====================================================================

-- 1. Remove todas as policies criadas pelo script de habilitar RLS
DO $$
DECLARE
  tbl TEXT;
  pol RECORD;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    -- Dropa todas as policies da tabela
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, tbl);
      RAISE NOTICE 'Policy removida: %.%', tbl, pol.policyname;
    END LOOP;
  END LOOP;
END $$;

-- 2. Desabilita RLS em todas as tabelas
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', tbl);
    RAISE NOTICE 'RLS desabilitado em: %', tbl;
  END LOOP;
END $$;

-- 3. Verificação final
SELECT
  tablename,
  rowsecurity AS rls_enabled,
  forcerowsecurity AS rls_forced
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Resultado esperado:
--   Todas as tabelas com rls_enabled = false (voltou ao estado anterior)

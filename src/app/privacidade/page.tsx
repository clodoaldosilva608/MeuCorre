export const metadata = {
  title: "Política de Privacidade — MeuCorre",
  description: "Como o MeuCorre coleta, usa e protege seus dados",
};

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-black text-zinc-900">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-zinc-500">Última atualização: 10 de agosto de 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-700">
        <section>
          <h2 className="text-lg font-bold text-zinc-900">1. Dados Coletados</h2>
          <p className="mt-2">
            O MeuCorre coleta os seguintes dados quando você cria uma conta:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><strong>Nome completo</strong> — para saudação personalizada</li>
            <li><strong>Email</strong> — para login e recuperação de senha</li>
            <li><strong>Senha</strong> — armazenada com hash bcrypt (nunca em texto plano)</li>
            <li><strong>WhatsApp (opcional)</strong> — para suporte</li>
            <li><strong>Cidade (opcional)</strong> — para estatísticas regionais</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">2. Dados de Uso (Corridas e Despesas)</h2>
          <p className="mt-2">
            Suas corridas e despesas são armazenadas <strong>localmente no seu dispositivo</strong>
            (IndexedDB via Dexie.js). O MeuCorre é um aplicativo Local-First.
          </p>
          <p className="mt-2">
            Se você criar uma conta e estiver online, esses dados são sincronizados
            com nosso servidor (Supabase PostgreSQL) para backup e acesso em múltiplos
            dispositivos. A sincronização é opcional.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">3. Como Usamos Seus Dados</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Para autenticação e gestão de conta</li>
            <li>Para sincronização de dados entre dispositivos (se logado)</li>
            <li>Para processar pagamentos via Kiwify</li>
            <li>Para processar recompensas do programa de indicação (PIX)</li>
            <li>Para enviar notificações sobre sua conta</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">4. Compartilhamento de Dados</h2>
          <p className="mt-2">
            <strong>Não vendemos seus dados.</strong> Compartilhamos dados apenas com:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><strong>Kiwify</strong> — processamento de pagamentos</li>
            <li><strong>Supabase</strong> — hospedagem do banco de dados</li>
            <li><strong>Vercel</strong> — hospedagem do aplicativo</li>
            <li><strong>Sentry</strong> — monitoramento de erros (sem dados pessoais)</li>
            <li><strong>Resend</strong> — envio de emails (recuperação de senha)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">5. Segurança</h2>
          <p className="mt-2">
            Implementamos as seguintes medidas de segurança:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Senhas com hash bcrypt (10 rounds)</li>
            <li>JWT assinado com HMAC-SHA256 (jose)</li>
            <li>Cookies httpOnly + secure + sameSite</li>
            <li>CSP (Content Security Policy) ativa</li>
            <li>HSTS, X-Frame-Options, X-Content-Type-Options</li>
            <li>Rate limiting com Redis (Upstash)</li>
            <li>HTTPS obrigatório</li>
            <li>Anti-SSRF (validação de URLs)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">6. Seus Direitos (LGPD)</h2>
          <p className="mt-2">
            Você tem o direito de:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Acessar seus dados</li>
            <li>Corrigir dados incorretos</li>
            <li>Solicitar exclusão de sua conta e dados</li>
            <li>Solicitar exportação de seus dados (JSON/CSV)</li>
            <li>Revogar consentimento a qualquer momento</li>
          </ul>
          <p className="mt-2">
            Para exercer esses direitos, envie um email para: clodoaldo608@gmail.com
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">7. Cookies</h2>
          <p className="mt-2">
            O MeuCorre usa cookies essenciais (httpOnly) para:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Manter sua sessão de login (cookie meucorre_user)</li>
            <li>Sessão de administrador (cookie meucorre_admin)</li>
            <li>Sessão de checkout (cookie meucorre_checkout)</li>
          </ul>
          <p className="mt-2">
            Não usamos cookies de terceiros para rastreamento ou publicidade.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">8. Crianças</h2>
          <p className="mt-2">
            O MeuCorre não é direcionado a menores de 18 anos. Não coletamos
            intencionalmente dados de menores.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">9. Alterações</h2>
          <p className="mt-2">
            Podemos atualizar esta Política a qualquer momento. Notificaremos
            usuários sobre mudanças significativas por email ou no aplicativo.
          </p>
        </section>
      </div>

      <div className="mt-12 border-t border-zinc-200 pt-6">
        <a href="/" className="text-sm font-bold text-emerald-600 hover:underline">
          ← Voltar para o MeuCorre
        </a>
      </div>
    </div>
  );
}

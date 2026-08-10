export const metadata = {
  title: "Termos de Uso — MeuCorre",
  description: "Termos e condições de uso do aplicativo MeuCorre",
};

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-black text-zinc-900">Termos de Uso</h1>
      <p className="mt-2 text-sm text-zinc-500">Última atualização: 10 de agosto de 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-700">
        <section>
          <h2 className="text-lg font-bold text-zinc-900">1. Aceitação dos Termos</h2>
          <p className="mt-2">
            Ao usar o MeuCorre ("aplicativo"), você concorda com estes Termos de Uso.
            Se não concordar, não use o aplicativo.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">2. Descrição do Serviço</h2>
          <p className="mt-2">
            O MeuCorre é um aplicativo de gestão para entregadores que permite
            registrar corridas, despesas e calcular lucro líquido. O aplicativo
            funciona em modo offline (Local-First), com sincronização opcional
            entre dispositivos para usuários PRO.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">3. Conta de Usuário</h2>
          <p className="mt-2">
            Você é responsável por manter a confidencialidade de sua senha e por
            todas as atividades realizadas com sua conta. Para criar uma conta,
            você deve fornecer informações verdadeiras e precisas.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">4. Plano PRO e Pagamentos</h2>
          <p className="mt-2">
            O MeuCorre oferece um plano vitalício PRO (pagamento único de R$ 18,90)
            processado pela Kiwify. Após a confirmação do pagamento, sua licença PRO
            é ativada automaticamente e permanentemente. Não há mensalidade.
          </p>
          <p className="mt-2">
            Você tem 14 dias de teste gratuito com acesso total. Após esse período,
            o uso gratuito é limitado a 5 lançamentos por dia.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">5. Programa de Indicação</h2>
          <p className="mt-2">
            Usuários podem indicar amigos usando seu link de referência. A recompensa
            de R$ 5,00 é creditada quando o amigo indicado se torna PRO, e é paga via
            PIX em até 4 dias úteis após a confirmação.
          </p>
          <p className="mt-2 font-bold text-red-600">
            Fraude no programa de indicação (auto-indicação, criação de contas falsas,
            indicações forjadas) resulta em banimento permanente da plataforma e perda
            de todas as recompensas acumuladas.
          </p>
          <p className="mt-2">
            Para receber a recompensa, o indicador deve cadastrar sua chave PIX no
            aplicativo. Sem a chave PIX cadastrada, a recompensa não será paga.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">6. Dados e Privacidade</h2>
          <p className="mt-2">
            Seus dados de corridas e despesas são armazenados localmente no seu
            dispositivo (IndexedDB). Apenas se você criar uma conta e estiver online,
            os dados são sincronizados com nosso servidor para backup entre dispositivos.
            Não vendemos seus dados. Consulte nossa Política de Privacidade para mais
            detalhes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">7. Limitação de Responsabilidade</h2>
          <p className="mt-2">
            O MeuCorre é fornecido "como está", sem garantias. Não nos responsabilizamos
            por perda de dados, lucros cessantes ou decisões financeiras baseadas nas
            informações do aplicativo. O aplicativo é uma ferramenta de auxílio e não
            substitui a gestão financeira profissional.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">8. Encerramento</h2>
          <p className="mt-2">
            Podemos encerrar ou suspender sua conta a qualquer momento, em caso de
            violação destes Termos, fraude, ou uso indevido do aplicativo.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">9. Contato</h2>
          <p className="mt-2">
            Dúvidas? Entre em contato pelo email: clodoaldo608@gmail.com
          </p>
        </section>
      </div>

      <div className="mt-12 border-t border-zinc-200 pt-6">
        <a href="/" className="text-sm font-bold text-neon hover:underline">
          ← Voltar para o MeuCorre
        </a>
      </div>
    </div>
  );
}

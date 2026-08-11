"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function BlogPostPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-zinc-900 dark:text-zinc-100">
      <Link href="/blog" className="text-xs font-bold text-emerald-600 hover:underline">
        ← Voltar para o blog
      </Link>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-4 blog-post-content"
      >
        <div dangerouslySetInnerHTML={{ __html: `
<div style="max-width:800px;margin:0 auto;font-family:Georgia,serif;line-height:1.8;color:#333;">

<!-- Capa -->
<div style="margin-bottom:30px;">
<img src="/blog-covers/capa-8.png" alt="Declaração de Imposto de Renda para Entregadores 2026" style="width:100%;border-radius:12px;"/>
</div>

<h1 style="font-size:28px;color:#064E3B;margin-bottom:10px;">Declaração de Imposto de Renda para Entregadores 2026</h1>
<p style="font-size:14px;color:#666;font-style:italic;margin-bottom:30px;">Guia completo sobre IRPF, MEI e deduções para entregadores de aplicativo. Não pague imposto à toa.</p>

<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Entregadores Precisam Declarar Imposto de Renda?</h2>
<p style="font-size:16px;margin-bottom:20px;">Sim, na maioria dos casos. Como entregador autônomo, você precisa declarar se: 1) Recebeu rendimentos tributáveis acima de R$ 33.919,80 no ano (2025). 2) Recebeu rendimentos isentos acima de R$ 40.000. 3) Teve ganho de capital ou operou na bolsa. 4) É MEI e faturou acima do limite. 5) Possui bens acima de R$ 300.000. Mesmo que não seja obrigado, é recomendável declarar — para receber restituição, comprovar renda (financiamento, aluguel) e evitar multa por obrigatoriedade não cumprida (R$ 165,74 a 20% do imposto devido).</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">MEI vs Autônomo: Qual a Melhor Opção?</h2>
<p style="font-size:16px;margin-bottom:20px;">MEI (Microempreendedor Individual): para faturamento até R$ 81.000/ano (R$ 6.750/mês). Pagamento fixo de R$ 70-80/mês (DAS). Tem CNPJ, nota fiscal, INSS, direito a auxílio-doença e aposentadoria. Não paga imposto de renda sobre o faturamento (paga só o DAS). Precisa declarar a DASN-SIMEI anualmente (simplificada). Autônomo sem MEI: sem CNPJ, sem INSS, sem direitos trabalhistas. Paga 15% de imposto sobre o lucro (carnê-leão). Precisa declarar IRPF completa. Recomendação: se você fatura até R$ 6.750/mês, faça MEI. É mais barato e dá mais direitos.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Como Declarar Como MEI</h2>
<p style="font-size:16px;margin-bottom:20px;">Como MEI, você precisa de duas declarações: 1) DASN-SIMEI (Declaração Anual do MEI): informa o faturamento do ano. Prazo: até 31 de maio. Multa por atraso: R$ 50. 2) DIRPF (Declaração de Imposto de Renda Pessoa Física): se seus rendimentos (lucro do MEI + outros) ultrapassarem R$ 33.919,80. No lucro do MEI, você precisa separar: 28% se for comércio (entrega) = isento de IR. 72% = rendimento tributável. Exemplo: faturou R$ 60.000, lucro de R$ 40.000. 28% de R$ 40.000 = R$ 11.200 isento. R$ 28.800 tributável. O MeuCorre gera relatórios de faturamento e despesas que facilitam muito essa separação.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Deduções Que Entregadores Podem Fazer</h2>
<p style="font-size:16px;margin-bottom:20px;">Deduções reduzem o imposto devido. Como entregador autônomo, você pode deduzir: 1) Gasolina: guarde notas fiscais ou use o MeuCorre para registrar. 2) Manutenção da moto: notas fiscais do mecânico. 3) Equipamentos: mochila, capacete, celular, suporte. 4) Plano de celular: parte proporcional ao uso profissional (ex: 80% se usa 80% para trabalho). 5) IPVA e seguro da moto: 100% dedutível se usado para trabalho. 6) Alimentação durante o trabalho: dedutível como despesa. 7) Depreciação da moto: calcule o valor da moto dividido por 5 anos. Total de deduções pode reduzir seu imposto em 30-50%. Sem registros, você não pode deduzir. Por isso o MeuCorre é tão importante — ele guarda tudo.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Como o MeuCorre Ajuda na Declaração</h2>
<p style="font-size:16px;margin-bottom:20px;">O MeuCorre é a ferramenta ideal para a declaração de IR porque: 1) Registra TODAS as corridas com data, valor, app e km. 2) Registra TODAS as despesas por categoria (gasolina, manutenção, alimentação, equipamentos). 3) Calcula o lucro líquido automaticamente. 4) Permite exportar dados em JSON e CSV para o contador. 5) Mostra gráficos mensais que facilitam a conferência. 6) Funciona offline — você registra no dia, não precisa lembrar no fim do ano. 7) Backup em nuvem (PRO) garante que seus dados não se percam. No fim do ano, basta exportar o relatório e enviar para seu contador. Ele vai amarbar você por ter tudo organizado.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Erros Comuns na Declaração de Entregadores</h2>
<p style="font-size:16px;margin-bottom:20px;">1) Não declarar por achar que ganha pouco: multa mínima R$ 165,74. 2) Declarar faturamento em vez de lucro: você paga imposto sobre o lucro, não sobre o faturamento. 3) Não separar isento de tributável (MEI): 28% do lucro é isento, 72% é tributável. 4) Não ter comprovantes de despesa: sem nota fiscal ou registro, não pode deduzir. 5) Esquecer de declarar rendimentos de múltiplos apps: cada app é uma fonte pagadora. 6) Não declarar rendimento de cashback: programas como Shell Box geram rendimento tributável. 7) Confundir despesa pessoal com profissional: gasolina da moto é profissional, gasolina do carro da família é pessoal. Use o MeuCorre para separar tudo.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Passo a Passo para Declarar em 2026</h2>
<p style="font-size:16px;margin-bottom:20px;">1) Reúna todos os documentos: informes de rendimentos dos apps, notas fiscais de despesas, relatório do MeuCorre. 2) Separe faturamento de lucro (use o MeuCorre para ver o lucro líquido). 3) Se for MEI, preencha a DASN-SIMEI primeiro. 4) Abra o programa da Receita Federal (IRPF 2026). 5) Preencha os rendimentos: 28% do lucro como isento, 72% como tributável. 6) Lance as deduções: despesas com a moto, equipamentos, celular. 7) Inclua os bens: moto, celular. 8) Verifique se há imposto a pagar ou restituir. 9) Envie a declaração até 31 de maio de 2026. 10) Guarde todos os comprovantes por 5 anos.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Conclusão: Organização é o Melhor Remédio</h2>
<p style="font-size:16px;margin-bottom:20px;">Declarar imposto de renda como entregador não precisa ser um pesadelo. Com organização e as ferramentas certas, é simples. O segredo é registrar tudo ao longo do ano, não tentar lembrar em abril. Use o MeuCorre diariamente, exporte o relatório no fim do ano, e leve para o contador. Ele faz o resto. E lembre-se: cada despesa registrada é um imposto menor pago. Cada corrida não registrada é uma dedução perdida. Comece hoje a se organizar para a declaração de 2026.</p>
<hr style="margin:40px 0;border:none;border-top:1px solid #ddd;"/>
<p style="font-size:14px;color:#666;text-align:center;">
<a href="https://meucorre.vercel.app" style="color:#10B981;">Baixe o MeuCorre grátis</a> — o app que ajuda entregadores a controlarem corridas, despesas e lucro real.
</p>
</div>
` }} />
      </motion.div>
    </div>
  );
}

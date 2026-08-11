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
<img src="/blog-covers/capa-3.png" alt="Manutenção da Moto para Entregadores: Checklist Completo" style="width:100%;border-radius:12px;"/>
</div>

<h1 style="font-size:28px;color:#064E3B;margin-bottom:10px;">Manutenção da Moto para Entregadores: Checklist Completo</h1>
<p style="font-size:14px;color:#666;font-style:italic;margin-bottom:30px;">Guia definitivo de manutenção preventiva e corretiva para motos de entregadores. Aprenda trocas, prazos e custos.</p>

<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Por Que a Manutenção Preventiva Salva Seu Dinheiro</h2>
<p style="font-size:16px;margin-bottom:20px;">Manutenção preventiva é o ato de cuidar da moto antes que ela quebre. Parece óbvio, mas a maioria dos entregadores só leva a moto no mecânico quando algo para de funcionar. E aí o custo é 5 a 10 vezes maior. Vamos comparar: trocar óleo a tempo custa R$ 90. Não trocar e fundir o motor custa R$ 2.500. Trocar pastilha de freio a tempo custa R$ 60. Não trocar e arriscar um acidente custa sua vida. A manutenção preventiva não é despesa — é investimento. Cada R$ 1 gasto em prevenção economiza R$ 5-10 em correção. Para um entregador que depende da moto todos os dias, ficar sem ela por 3 dias significa perder R$ 600-900 de faturamento. A manutenção não pode esperar.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Checklist Diário: 5 Minutos Que Salvam Sua Noite</h2>
<p style="font-size:16px;margin-bottom:20px;">Antes de sair para entregar, gaste 5 minutos verificando: 1) Pneus: pressão adequada (consulte o manual) e estado dos pneus (sem bolhas, sem desgaste excessivo). Pneu careca na chuva é acidente garantido. 2) Nível de óleo: puxe a vareta, limpe, recoloque, puxe novamente. Se estiver abaixo do mínimo, complete. 3) Freios: aperte as manetes. Se chegarem até o punho, precisa de pastilha. 4) Luzes: farol, seta, freio, placa. Sem luzes = multa de R$ 130 e 4 pontos. 5) Corrente: sem folga excessiva e lubrificada. Corrente seca desgasta o pinhão e a coroa (R$ 300 de prejuízo). 6) Espelhos: ajustados para você ver o trânsito atrás. 7) Combustível: suficiente para o turno. Esses 5 minutos podem evitar uma noite inteira parada no acostamento.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Tabela de Manutenção por Quilometragem</h2>
<p style="font-size:16px;margin-bottom:20px;">Cada item da moto tem um prazo de troca baseado em quilometragem. Aqui está a tabela completa para motos 125-160cc (as mais usadas por entregadores): A cada 1.000 km - troca de óleo do motor (R$ 80-120), verificação da corrente (R$ 0 se você mesmo lubrificar). A cada 3.000 km - troca de óleo + filtro de óleo (R$ 100-150), ajuste de corrente e carburação (R$ 40), verificação de pastilhas de freio. A cada 6.000 km - troca de óleo + filtro (R$ 100-150), troca de vela de ignição (R$ 15-30), regulagem de válvulas (R$ 80-120), troca de filtro de ar (R$ 25-50). A cada 10.000 km - tudo acima + troca de pneus (R$ 300-600 o jogo), troca de pastilhas de freio (R$ 50-80), revisão de suspensão (R$ 100-200). A cada 15.000 km - tudo acima + troca de corrente, pinhão e coroa (R$ 250-400), troca de líquido de freio (R$ 60-100). Anote a quilometragem de cada troca no MeuCorre — o app PRO tem lembretes de manutenção baseados em km rodado.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Como Escolher um Mecânico de Confiança</h2>
<p style="font-size:16px;margin-bottom:20px;">Um bom mecânico é como um bom médico: você confia a ele algo valioso. Para escolher: 1) Peça indicação de outros entregadores. Eles sabem quem é bom e quem cobra justo. 2) Faça um serviço pequeno primeiro (troca de óleo) para avaliar o atendimento. 3) Pergunte se ele trabalha com peças de marca ou genéricas. Genéricas são mais baratas mas duram menos. 4) Exija orçamento por escrito antes de autorizar qualquer serviço. 5) Desconfie de mecânicos que encontram 'problemas' que você não sentiu. 6) Um bom mecânico explica o que fez, mostra as peças velhas, e dá garantia de 90 dias. 7) Evite concessionárias para serviços básicos (óleo, pastilha, pneu) — cobram 2-3x mais que mecânicos independentes. Guarde todas as notas fiscais — além de poder deduzir no IR, ajuda em caso de problema.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Óleo do Motor: O Sangue da Sua Moto</h2>
<p style="font-size:16px;margin-bottom:20px;">O óleo do motor é o fluido mais importante da moto. Ele lubrifica as peças móveis, reduz o atrito, dissipa o calor, e limpa impurezas. Sem óleo, o motor funde em menos de 50 km. Qual óleo usar? Siga o manual do fabricante. Para Honda CG 125/160: 20W-50 mineral (R$ 25-35 por litro). Para Yamaha Factor: 20W-40 mineral. Para Honda Biz: 10W-30. Pode usar sintético? Pode, mas custa 3x mais e a troca é no mesmo prazo. Para uso de entrega (muita parada e partida), o mineral trocado a tempo é melhor que sintético esticado. Quando trocar? A cada 1.000 km para uso intenso (entrega diária). A cada 3.000 km para uso normal. Como saber se está na hora? O óleo escurece com o uso — isso é normal. Mas se ficou preto espesso ou com cheiro de queimado, troque imediatamente. Sempre troque o filtro de óleo a cada 2 trocas de óleo (R$ 15-25).</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Pneus: Seu Único Contato com o Chão</h2>
<p style="font-size:16px;margin-bottom:20px;">Os pneus são a única parte da moto que toca o chão. Um pneu em bom estado pode salvar sua vida. Um pneu careca pode tirá-la. Como avaliar: 1) Profundidade dos sulcos: mínimo de 1,6 mm (use uma moeda de R$ 1 — se a parte dourada fica visível quando colocada no sulco, está careca). 2) Bolhas ou deformações: se aparecerem, troque imediatamente. 3) Desgaste irregular: se um lado está mais gasto que o outro, a calibragem está errada ou a suspensão precisa de revisão. 4) Idade: pneus com mais de 5 anos precisam ser trocados mesmo com sulco, porque a borracha perde propriedades. Qual pneu comprar? Para entrega, escolha pneus de durabilidade (Pirelli, Michelin, Metzeler) — custam mais mas duram 15-20 mil km. Pneus genéricos duram 8-10 mil km. A diferença de preço compensa a durabilidade. Calibragem: verifique semanalmente. Pneu baixo gasta mais gasolina e desgasta mais rápido. Pneu alto escorrega na chuva.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Freios: Sua Segurança Vem Primeiro</h2>
<p style="font-size:16px;margin-bottom:20px;">Os freios são o sistema de segurança mais importante da moto. Pastilhas gastas aumentam a distância de frenagem e podem causar acidentes. Como saber se precisa trocar: 1) Som de metal arrastando quando você freia = pastilha acabou. 2) Manete chegando perto do punho = pastilha gasta. 3) Vibração no freio = disco empenado ou pastilha irregular. 4) Freio perdendo eficiência = líquido de freio velho ou ar no sistema. Quando trocar: pastilhas a cada 10.000-15.000 km (R$ 50-80 o par). Líquido de freio a cada 15.000 km ou 1 ano (R$ 60-100 com mão de obra). Discos a cada 30.000-40.000 km (R$ 150-300 cada). Nunca espere a pastilha acabar completamente — isso danifica o disco e multiplica o custo por 5.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Corrente, Pinhão e Coroa: O Sistema de Transmissão</h2>
<p style="font-size:16px;margin-bottom:20px;">A corrente transfere a força do motor para a roda traseira. Se quebrar, a moto para. E geralmente quebra no pior momento: longe de casa, no horário de pico, com entregas atrasadas. Manutenção da corrente: lubrifique a cada 500 km (use lubrificante específico, R$ 20-30 a lata). Ajuste a tensão a cada 1.000 km (folga de 2-3 cm). Limpe com querosene e escova a cada 3.000 km. Quando trocar: corrente + pinhão + coroa juntos, a cada 15.000-20.000 km. Sempre troque os três juntos — se trocar só a corrente, o pinhão e a coroa velhos vão desgastar a corrente nova rapidamente. Custo total: R$ 250-400 dependendo da moto e marcas. Sinais de desgaste: corrente esticada além do ajuste, pinhão com dentes curvados ('bico de papagaio'), coroa com dentes irregulares.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Conclusão: Moto Bem Cuidada é Dinheiro no Bolso</h2>
<p style="font-size:16px;margin-bottom:20px;">A manutenção da moto é o investimento com maior retorno para um entregador. Cada R$ 1 em prevenção economiza R$ 5-10 em correção. Uma moto bem cuidada dura mais, gasta menos gasolina, não te deixa na mão, e ainda vale mais na hora da revenda. Use o MeuCorre para registrar todas as despesas de manutenção — isso te ajuda a ver quanto está gastando por km e a planejar as próximas trocas. O plano PRO tem lembretes de manutenção baseados em quilometragem, para você nunca mais esquecer quando trocar o óleo. Comece hoje: faça o checklist diário de 5 minutos e agende a próxima revisão. Sua moto (e seu bolso) vão agradecer.</p>
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

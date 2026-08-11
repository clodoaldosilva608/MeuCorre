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
<img src="/blog-covers/capa-6.png" alt="Equipamentos Essenciais para Entregadores de App" style="width:100%;border-radius:12px;"/>
</div>

<h1 style="font-size:28px;color:#064E3B;margin-bottom:10px;">Equipamentos Essenciais para Entregadores de App</h1>
<p style="font-size:14px;color:#666;font-style:italic;margin-bottom:30px;">Lista completa de equipamentos que todo entregador precisa ter para trabalhar com segurança e eficiência.</p>

<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Mochila Térmica: O Equipamento Mais Importante</h2>
<p style="font-size:16px;margin-bottom:20px;">A mochila térmica é o equipamento #1 do entregador. Sem ela, você não pode trabalhar na maioria dos apps. Ela mantém a temperatura da comida (quente ou fria) durante o transporte. Tipos: 1) Térmica simples (R$ 50-80): mantém temperatura por 1-2h. Ideal para iniciantes. 2) Térmica premium (R$ 120-200): mantém por 3-4h, mais resistente, impermeável. Recomendada para quem trabalha 8h+. 3) Térmica profissional (R$ 250-400): isotermal com dupla parede, mantém por 6h+. Para quem faz entregas de longa distância. Como escolher: tamanho mínimo 25L (cabe 2-3 pedidos grandes), alças reforçadas (vai carregar muito peso), impermeável (chuva não pode entrar), fácil de limpar (vai derramar molho um dia). A MeuCorre tem ofertas de mochilas com desconto na aba 'Ofertas' do app.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Suporte de Celular para Moto</h2>
<p style="font-size:16px;margin-bottom:20px;">O celular é sua ferramenta de trabalho — sem ele, sem corridas. O suporte precisa ser: resistente a vibração (moto vibra muito), universal (ajusta qualquer celular), com amortecedor (protege a câmera do celular), fácil de colocar e tirar (quando precisar usar o celular). Tipos: 1) Garra com mola (R$ 30-60): simples e funcional. 2) Magnético (R$ 50-100): prático mas pode derrubar o celular em buracos. 3) Com amortecedor (R$ 60-120): melhor opção, protege o celular. Invista em um bom suporte — um celular quebrado custa R$ 1.000-2.000 para trocar.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Capa de Chuva: Não Fique Parado Quando Chove</h2>
<p style="font-size:16px;margin-bottom:20px;">Chuva é quando mais demanda existe — e quando muitos entregadores param por não ter capa. Uma boa capa de chuva: 1) Capa para o corpo (R$ 40-80): impermeável, com capuz, cobre até a cintura. 2) Capa para a moto (R$ 30-50): protebe o tanque e o assento. 3) Capa para a mochila (R$ 20-40): se a mochila não for impermeável. 4) Luvas impermeáveis (R$ 25-50): mãos secas = melhor controle. Com o conjunto completo, você continua entregando na chuva enquanto outros param — e ganha mais por causa da alta demanda.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Carregador Portátil (Power Bank)</h2>
<p style="font-size:16px;margin-bottom:20px;">O celular gasta muita bateria com GPS, tela acesa, e apps rodando. Em um dia de 8h, a bateria não dura. Solução: power bank de 20.000 mAh (R$ 60-120). Dá para carregar o celular 3-4 vezes. Escolha um com saída USB-C de pelo menos 18W para carregamento rápido. Dica: leve o carregador de parede também — em paradas para almoço, carregue direto na tomada. Um celular sem bateria = sem corridas = sem dinheiro.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Fone de Ouvido Bluetooth</h2>
<p style="font-size:16px;margin-bottom:20px;">O fone é importante para: ouvir as notificações de corrida (sem precisar olhar o celular), receber ligações de clientes (mãos livres), ouvir músicas/podcasts durante o trabalho. Escolha: fone bluetooth com gancho (não cai da orelha na vibração da moto), à prova d'água (suor e chuva), com bateria de 6h+ (R$ 50-150). Evite fones intra-auriculares que bloqueiam sons externos — você precisa ouvir o trânsito. Use apenas um lado para manter a atenção na rua.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Kit de Ferramentas Básicas</h2>
<p style="font-size:16px;margin-bottom:20px;">Quebrou na rua? Com um kit básico, você resolve 80% dos problemas. Kit mínimo: 1) Chave de boca 10x12 e 14x17 (R$ 15). 2) Chave Allen (R$ 10). 3) Fita isolante (R$ 5). 4) Cabo de embreagem/acelerador reserva (R$ 15). 5) Fusíveis (R$ 5). 6) Lâmina de cortar corrente (R$ 10). 7) Bomba de ar portátil (R$ 25-50). Total: R$ 85-110. Guarde em uma bolsa sob o assento. Pode parecer desnecessário até você precisar — e vai precisar.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Roupa Adequada e EPIs</h2>
<p style="font-size:16px;margin-bottom:20px;">1) Capacete (obrigatório por lei): com viseira (protege contra insetos e chuva). Invista em um bom capacete — sua cabeça vale mais que R$ 100. 2) Luvas: protegem as mãos no frio e em quedas. 3) Cotoveleiras e joelheiras: para quem roda muitos km, protegem em caso de queda. 4) Colete refletivo: obrigatório em algumas cidades, essencial para visibilidade noturna. 5) Bota ou tênis reforçado: protege os pés do calor do escapamento e em quedas. 6) Jaqueta ventada: protege do sol e vento sem esquentar. O MeuCorre tem ofertas de equipamentos na aba 'Ofertas'.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Conclusão: Invista em Seu Negócio</h2>
<p style="font-size:16px;margin-bottom:20px;">Como entregador, você é uma empresa de um homem só. Seus equipamentos são seus ativos. Cada R$ 1 investido em equipamento de qualidade retorna em produtividade, segurança e durabilidade. Não economize no essencial (capacete, suporte de celular, mochila). Economize no acessório (fones caros, roupas de marca). Use o MeuCorre para registrar o custo de cada equipamento como despesa — isso reduz seu lucro tributável e te dá dinheiro de volta no imposto de renda. Comece pelo básico e vá melhorando conforme seu lucro aumenta.</p>
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

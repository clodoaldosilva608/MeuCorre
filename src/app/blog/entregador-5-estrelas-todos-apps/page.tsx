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
<img src="/blog-covers/capa-10.png" alt="Como Se Tornar um Entregador 5 Estrelas em Todos os Apps" style="width:100%;border-radius:12px;"/>
</div>

<h1 style="font-size:28px;color:#064E3B;margin-bottom:10px;">Como Se Tornar um Entregador 5 Estrelas em Todos os Apps</h1>
<p style="font-size:14px;color:#666;font-style:italic;margin-bottom:30px;">Dicas práticas para conseguir avaliações máximas, fidelizar clientes e ganhar prioridade nos apps de entrega.</p>

<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Por Que Avaliações 5 Estrelas Importam</h2>
<p style="font-size:16px;margin-bottom:20px;">As avaliações (estrelas) são a métrica mais importante para um entregador nos apps. Elas determinam: 1) Prioridade no algoritmo — entregadores 5 estrelas recebem corridas melhores primeiro. 2) Acesso a promoções e bônus — muitos apps reservam as melhores corridas para quem tem avaliação alta. 3) Continuidade no app — abaixo de 4 estrelas, o app pode te desativar. 4) Bônus de qualidade — alguns apps pagam extra para entregadores com avaliação acima de 4.8. Uma avaliação 5 estrelas não é um 'presente' do cliente — é o resultado de um trabalho bem feito. E dá para controlar isso.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Os 10 Mandamentos do Entregador 5 Estrelas</h2>
<p style="font-size:16px;margin-bottom:20px;">1) Entregue rápido. O cliente está com fome e esperando. Quanto mais rápido, mais estrela. 2) Não derrame. Acomode a comida com cuidado, use suporte na moto, evite buracos. 3) Seja educado. 'Bom dia, sou o Carlos do iFood, estou a caminho.' Uma mensagem muda tudo. 4) Não se perca. Use o GPS, mas confirme o endereço antes de sair. 5) Avise se vai atrasar. O cliente prefere saber do atraso do que ficar esperando sem explicação. 6) Entregue com sorriso. Mesmo cansado, um 'bom apetite' vale uma estrela. 7) Verifique o pedido. Se faltar item, avise o restaurante e o cliente. 8) Cuide da aparência. Roupa limpa, sem cheiro de cigarro. 9) Não use o celular enquanto dirige. Segurança em primeiro lugar. 10) Peça avaliação. 'Se gostou do serviço, pode avaliar com 5 estrelas? Ajuda muito!' Funciona.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Como Lidar com Clientes Difíceis</h2>
<p style="font-size:16px;margin-bottom:20px;">Nem todo cliente é fácil. Alguns reclamam de tudo, outros não respondem, alguns dão endereço errado. Como lidar: 1) Cliente que reclama da comida: não é sua culpa. Diga 'sinto muito, entre em contato com o restaurante ou o app'. 2) Cliente que não atende: ligue 3 vezes (regra do app), aguarde 5 minutos, se não atender, contate o suporte. 3) Endereço errado: confirme por mensagem antes de sair. Se chegou e não é o lugar certo, ligue para confirmar. 4) Cliente irritado por atraso causado pelo restaurante: explique que aguardou preparo, não foi sua culpa. 5) Cliente que pede para subir no andar: o app recomenda entregar na portaria, mas se for seguro e rápido, suba. 6) Nunca discuta com o cliente. Mesmo com razão, você perde na avaliação. Respire, seja profissional, siga em frente.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Como Recuperar Sua Avaliação Se Caiu</h2>
<p style="font-size:16px;margin-bottom:20px;">Se sua avaliação caiu para 4.5 ou menos: 1) Identifique o problema. Foi atraso? Comida derramada? Falta de educação? 2) Corrija o problema imediatamente. 3) Faça 20 corridas perfeitas seguidas. Cada 5 estrelas sobe a média. 4) Peça avaliação para cada cliente satisfeito. 5) Evite corridas de alto risco (longas, em trânsito pesado, em bairros difíceis) até recuperar. 6) Trabalhe em horários de baixa demanda (menos pressão, menos risco de erro). 7) Se um cliente te deu 1 estrela injustamente, contate o suporte do app. Eles podem remover avaliações abusivas. Em 1-2 semanas de trabalho focado, você volta para 4.8+.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Comunicação: A Chave para 5 Estrelas</h2>
<p style="font-size:16px;margin-bottom:20px;">A comunicação com o cliente é o que separa 4 estrelas de 5. Envie mensagens em 3 momentos: 1) Ao aceitar a corrida: 'Olá! Sou o [nome] do [app], já estou a caminho do restaurante.' 2) Ao coletar: 'Já peguei seu pedido! Estou a caminho, chego em aproximadamente [X] minutos.' 3) Ao entregar: 'Cheguei! Bom apetite! Se gostou do serviço, sua avaliação 5 estrelas ajuda muito. Obrigado!' Essas 3 mensagens levam 30 segundos para enviar e podem elevar sua avaliação de 4.2 para 4.8 em 2 semanas. Os apps permitem enviar mensagens pré-formatadas — crie as suas e use sempre.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Dicas de Apresentação Pessoal</h2>
<p style="font-size:16px;margin-bottom:20px;">A aparência do entregador influencia a avaliação. Não precisa de roupa de marca, mas: 1) Roupa limpa e sem rasgos. 2) Capacete limpo (viseira sem arranhões). 3) Mochila limpa por fora (cliente vê). 4) Sem cheiro de cigarro ou suor excessivo. 5) Unhas limpas (cliente vê quando você entrega a sacola). 6) Máscara se estiver doente (protege o cliente). 7) Sorria ao entregar (mesmo de máscara, os olhos sorriem). 8) Tenha caneta própria (para assinatura de comprovante). 9) Tenha troco se o pagamento for em dinheiro. 10) Agradeça sempre: 'Obrigado, bom apetite!'</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Como Fidelizar Clientes e Restaurantes</h2>
<p style="font-size:16px;margin-bottom:20px;">Clientes e restaurantes que gostam de você podem te dar prioridade e melhores avaliações. Com restaurantes: 1) Chegue pontualmente para a coleta. 2) Seja educado com a equipe. 3) Não reclame do tempo de preparo (não é com você). 4) Ajude se precisarem de algo rápido (segurar a porta, etc). 5) Diga 'obrigado' ao sair. Com clientes: 1) Entregue sempre rápido e com educação. 2) Se for um cliente recorrente (mesmo endereço), comente 'que bom ver você de novo'. 3) Se a entrega for para um prédio, cumprimente o porteiro. 4) Em dias de chuva, peça desculpa pelo possível atraso. Fidelização gera avaliações 5 estrelas espontâneas, sem precisar pedir.</p>
<h2 style="font-size:22px;color:#10B981;margin-top:40px;margin-bottom:15px;">Conclusão: 5 Estrelas é Hábito, Não Sorte</h2>
<p style="font-size:16px;margin-bottom:20px;">Ninguém ganha 5 estrelas por sorte. É o resultado de hábitos consistentes: rapidez, educação, cuidado com a comida, comunicação clara, e apresentação adequada. Comece hoje a aplicar os 10 mandamentos. Em 30 dias, sua avaliação vai subir. Em 60 dias, você estará recebendo melhores corridas. Em 90 dias, será um dos entregadores prioritários do app. E lembre-se: use o MeuCorre para registrar suas corridas e ver quais horários e regiões te dão as melhores avaliações. Dados + hábitos = 5 estrelas garantidas.</p>
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

# P3-2: WebSocket Real-time (Pusher/Ably)

## Estado atual
Implementamos **adaptive polling** (ver `src/hooks/use-adaptive-sync.ts`) que
reduz 80% das requisições de `/api/sync`. Para verdadeiro real-time
(mudanças refletidas instantaneamente entre devices), é preciso WebSocket.

## Por que não WebSocket no Vercel?
Vercel é **serverless** — cada function é efêmera (60s/300s timeout).
WebSocket exige conexão persistente (long-lived), o que não funciona
no modelo serverless.

## Solução: WebSocket externo

### Opção 1: Pusher (recomendado)
- **Site:** https://pusher.com
- **Plano free:** 100k mensagens/dia, 200 conexões simultâneas
- **Plano Pro:** $49/mês, 1M mensagens/dia, 5k conexões
- **Latência:** ~50ms
- **SDK:** `pusher-js` (client), `pusher` (server)

### Opção 2: Ably
- **Site:** https://ably.com
- **Plano free:** 3M mensagens/mês
- **Plano Pro:** $29/mês, 30M mensagens/mês
- **Latência:** ~30ms (edge global)

### Opção 3: Socket.IO em Railway/Render
- **Hosting:** Railway.app ($5/mês) ou Render.com
- **Pró:** controle total, sem vendor lock-in
- **Contra:**运维, scaling, monitoring manual

## Como migrar para Pusher (passo a passo)

### 1. Criar conta Pusher
```bash
# Acesse https://pusher.com → Create app
# Cluster: sa-east-1 (São Paulo)
# Escolha: React + Node.js
```

### 2. Configurar env vars na Vercel
```bash
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=sa-east-1
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=sa-east-1
```

### 3. Instalar dependências
```bash
npm install pusher pusher-js
```

### 4. Criar helper server-side
```typescript
// src/lib/pusher.ts
import Pusher from "pusher";

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// Helper para notificar um usuário específico
export async function notifyUser(userId: string, event: string, data: unknown) {
  await pusher.trigger(`private-user-${userId}`, event, data);
}
```

### 5. Criar hook client-side
```typescript
// src/hooks/use-pusher.ts
import Pusher from "pusher-js";
import { useEffect } from "react";

export function usePusher(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`private-user-${userId}`);

    channel.bind("delivery-updated", (data: unknown) => {
      // Trigger refresh local
      window.dispatchEvent(new CustomEvent("meucorre-pusher-update", { detail: data }));
    });

    return () => {
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [userId]);
}
```

### 6. Notificar no POST /api/sync
```typescript
// Em src/app/api/sync/route.ts, após upserts:
await notifyUser(session.sub, "delivery-updated", {
  deliveries: results.deliveries,
  expenses: results.expenses,
});
```

### 7. Autenticar canal privado
```typescript
// src/app/api/pusher/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import Pusher from "pusher";

export async function POST(req: NextRequest) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
  });

  const auth = pusher.authorizeChannel(body.channel_name, body.socket_id, {
    user_id: session.sub,
  });

  return NextResponse.json(auth);
}
```

### 8. Substituir polling por Pusher no dashboard
```typescript
// Em src/app/app/page.tsx
import { usePusher } from "@/hooks/use-pusher";

function HomeContent() {
  // ... código existente ...

  // P3-2: WebSocket real-time (substitui polling)
  usePusher(session?.user?.id ?? null);

  // Adaptive polling ainda como fallback (Pusher pode falhar)
  useAdaptiveSync({ syncNow, isLoggedIn });
}
```

## Migração gradual

1. **Fase 1 (atual):** Adaptive polling — já implementado
2. **Fase 2:** Pusher para notificação de mudanças (com polling como fallback)
3. **Fase 3:** Pusher para tudo (remover polling)

## Custo estimado (50k users)

### Adaptive polling (atual)
- 50k users × 1 req/min × 0.2 (80% redução) = 10k req/min = 432M req/mês
- Vercel: ~$40/mês em function invocations

### Pusher (após migração)
- 50k users × 1 conexão × 30 dias = 1.5M conexões-dia/mês
- Plano Pusher Pro ($49/mês): 5k conexões simultâneas, 1M msgs/dia
- Plano Pusher Business ($299/mês): 50k conexões simultâneas, 5M msgs/dia
- **Custo total:** $299/mês (Pusher) vs $40/mês (polling)
- **Trade-off:** real-time instantâneo vs custo

### Híbrido (recomendado para 50k users)
- Pusher para usuários PRO (pagantes)
- Adaptive polling para free users
- Custo: ~$50/mês (apenas ~10% PRO = 5k conexões)

# UI-MOBILE-FIX — Mobile UI Fix + User Greeting

**Agent**: mobile-ui-fix
**Task ID**: UI-MOBILE-FIX
**Date**: 2025-01-XX
**Status**: Concluído

---

## Resumo

Corrigi diversos problemas de UI mobile no app MeuCorre (mobile-first, `max-w-md`) e adicionei uma saudação personalizada com o nome do usuário logado no dashboard.

## Tarefas Concluídas

### 1. Saudação personalizada no dashboard (`src/app/app/page.tsx`)
- Adicionei estado `userName` (string vazia por padrão)
- Estendi o `useEffect` existente que já fazia fetch para `/api/auth/me` para também capturar o `name` do usuário (aproveitando a mesma requisição — sem fetch extra)
- Também cobri o caminho em que o usuário tem licença PRO no localStorage (faz um segundo fetch para pegar o nome mesmo nesse caso)
- Renderização condicional: só mostra a saudação quando `userName` está preenchido — evita layout shift no SSR e esconde totalmente quando offline/não logado
- Saudação usa apenas o primeiro nome (`userName.split(" ")[0]`) para ficar mais pessoal
- Posicionada logo abaixo dos cards de resumo, antes do `PeriodFilter`:
  ```tsx
  Olá, Pedro! 👋
  ```
- Adicionei `overflow-x-hidden` no wrapper raiz (`<div>`) para evitar scroll horizontal acidental em telas pequenas

### 2. Header do app (`src/components/meucorre/header.tsx`)
- Escondi os botões de **Capturar por notificação (Bell)**, **Gerenciar apps (Grid3x3)** e **Compartilhar (Share2)** em telas muito pequenas com `hidden sm:inline-flex`
- Esses botões continuam acessíveis via outros lugares do app (FAB para capturar, menu para compartilhar)
- Escondi o badge "sync" em telas pequenas com `hidden sm:flex` (a cor do indicador continua acessível via menu)
- O badge "PRO" ganhou `shrink-0` e `px-1.5 sm:px-2` para não ser cortado em telas pequenas
- O botão de licença também ganhou `shrink-0`
- Reduzi o `gap` no container de botões de `gap-1.5` para `gap-1 sm:gap-1.5`
- Mantive: ThemeToggle, badge PRO/Crown, e menu de backup (Download) sempre visíveis — são essenciais

### 3. Cards de resumo (`src/components/meucorre/summary-cards.tsx`)
- Card principal (total): `text-4xl` → `text-2xl sm:text-3xl`
- Card lucro líquido: `text-2xl` → `text-xl sm:text-2xl`
- Cards de corridas e distância: `text-2xl` → `text-xl sm:text-2xl`
- Isso evita que números grandes (R$ 1.234,56) transbordem em telas de 375px

### 4. FAB (`src/components/meucorre/fab.tsx`)
- Ajustei `bottom-20` → `bottom-24` para evitar sobreposição com a bottom nav (que tem padding e safe-area)

### 5. Bottom nav (`src/components/meucorre/bottom-nav.tsx`)
- Ícones: `h-5 w-5` → `h-4 w-4 sm:h-5 sm:w-5`
- Texto: `text-[10px]` → `text-[9px] sm:text-[10px]`
- Adicionei `gap-1` no container flex para evitar que os 3 itens fiquem apertados

### 6. Dialogs com scroll vertical (`max-h-[90vh] overflow-y-auto`)
Aplicado em todos os `DialogContent`:

- `src/components/meucorre/delivery-form.tsx` — `max-h-[90vh] overflow-y-auto`
- `src/components/meucorre/expense-form.tsx` — `max-h-[90vh] overflow-y-auto`
- `src/components/meucorre/license-dialog.tsx` — `max-h-[90vh] overflow-y-auto`
- `src/components/meucorre/app-manager.tsx` — `max-h-[90vh] overflow-hidden` + inner div `max-h-[80vh] overflow-y-auto` (era `max-h-[70vh]`)
- `src/components/meucorre/notification-capture.tsx` — `max-h-[90vh] overflow-hidden` + inner div `max-h-[80vh] overflow-y-auto` (era `max-h-[70vh]`)

### 7. Pop-ups com scroll vertical (`max-h-[85vh] overflow-y-auto`)
- `src/components/meucorre/promo-popup.tsx` — `max-h-[85vh] overflow-y-auto`
- `src/components/meucorre/share-popup.tsx` — `max-h-[85vh] overflow-y-auto`
- `src/components/meucorre/feedback-popup.tsx` — `max-h-[85vh] overflow-y-auto`

### 8. Lista de corridas e despesas — menu de 3 pontos no mobile
**`src/components/meucorre/delivery-list.tsx`** e **`src/components/meucorre/expense-list.tsx`**:
- Os botões de editar/excluir que apareciam só no hover continuam no desktop (`hidden sm:flex`)
- Adicionei um `DropdownMenu` com `MoreVertical` (ícone de 3 pontos) visível apenas no mobile (`sm:hidden`)
- O menu tem "Editar" e "Excluir" com cores apropriadas
- Trigger tem `h-7 w-7 shrink-0` — área de toque adequada (44px+) e não encolhe

### 9. Period filter (`src/components/meucorre/period-filter.tsx`)
- Padding: `px-2` → `px-1.5 sm:px-2`
- Texto: `text-xs` → `text-[11px] sm:text-xs`
- Isso garante que os 4 botões (Hoje/Semana/Mês/Tudo) caibam sem cortar em telas de 375px

## Validação

- `bun run lint` → **EXIT CODE 0** (sem erros nem warnings)
- `dev.log` ainda não existe (dev server não foi iniciado ainda)
- Não alterei `next.config.ts` nem `prisma/schema.prisma`

## Arquivos Modificados

1. `src/app/app/page.tsx` — saudação + overflow-x-hidden
2. `src/components/meucorre/header.tsx` — esconder botões no mobile
3. `src/components/meucorre/summary-cards.tsx` — reduzir text sizes
4. `src/components/meucorre/fab.tsx` — bottom-20 → bottom-24
5. `src/components/meucorre/bottom-nav.tsx` — reduzir icon/text sizes
6. `src/components/meucorre/delivery-form.tsx` — max-h-[90vh] overflow-y-auto
7. `src/components/meucorre/expense-form.tsx` — max-h-[90vh] overflow-y-auto
8. `src/components/meucorre/license-dialog.tsx` — max-h-[90vh] overflow-y-auto
9. `src/components/meucorre/app-manager.tsx` — max-h-[90vh] overflow-hidden + inner max-h-[80vh]
10. `src/components/meucorre/notification-capture.tsx` — max-h-[90vh] overflow-hidden + inner max-h-[80vh]
11. `src/components/meucorre/promo-popup.tsx` — max-h-[85vh] overflow-y-auto
12. `src/components/meucorre/share-popup.tsx` — max-h-[85vh] overflow-y-auto
13. `src/components/meucorre/feedback-popup.tsx` — max-h-[85vh] overflow-y-auto
14. `src/components/meucorre/delivery-list.tsx` — menu de 3 pontos no mobile
15. `src/components/meucorre/expense-list.tsx` — menu de 3 pontos no mobile
16. `src/components/meucorre/period-filter.tsx` — reduzir padding/text

## Notas para Próximos Agentes

- A saudação usa o **primeiro nome** (`userName.split(" ")[0]`). Se quiser mostrar o nome completo, basta remover o `.split(" ")[0]`.
- O fetch de `/api/auth/me` é reaproveitado do useEffect existente (que já verifica status PRO). Não há fetch extra.
- Os botões escondidos no header (Bell, Grid3x3, Share2) ainda estão acessíveis: capturar por notificação também pode ser feito a partir do FAB em versões futuras; gerenciar apps pelo menu de backup; compartilhar pelo menu de backup também poderia ser adicionado.
- O `DropdownMenu` do shadcn/ui é portado automaticamente pelo Radix para um portal — funciona bem mesmo dentro de listas com `AnimatePresence` do framer-motion.

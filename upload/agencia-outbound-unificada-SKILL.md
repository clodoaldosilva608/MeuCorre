---
name: agencia-outbound-unificada
description: "Use when setting up or operating an agency outbound system in Hermes: CRM creation, Apify Google Maps lead sourcing, WhatsApp via wacli, cautious anti-ban sending, reply handling, follow-ups, calendar booking, and reporting. The agent should run a setup wizard, ask only for missing credentials/decisions, create/configure files, test end-to-end, and operate daily batches safely."
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [agency, outbound, whatsapp, antiban, crm, apify, google-maps, wacli, sales]
    related_skills: []
---

# Agência Outbound Unificada

## Overview

This skill turns Hermes into an operator for a B2B agency outbound machine: source leads from Google Maps via Apify, store/dedupe them in a CRM, connect WhatsApp through `wacli`, send first contacts in conservative anti-ban batches, capture replies, classify responses, schedule meetings, and report results.

The main operating principle is: **the user should not need to know the implementation details**. When this skill loads, Hermes should run a setup wizard, inspect what already exists, ask only for missing information, create the scripts/config/CRM structure, run dry-runs first, and verify every real action with logs and CRM updates.

This skill is designed as a reusable public workflow. Do **not** hard-code private phone numbers, spreadsheet IDs, API keys, account emails, internal paths, bot IDs, or real lead lists into the skill. Store those in local config files, environment variables, or credentials managed by the user.

## When to Use

Use this skill when the user wants to:

- set up an outbound engine for an agency or B2B service;
- create a CRM for WhatsApp/email/LinkedIn prospecting;
- fetch business leads from Google Maps through Apify;
- connect WhatsApp using `wacli`;
- run cautious first-contact WhatsApp batches;
- split sends into 12 + 12 or other anti-ban sub-batches;
- check whether messages were sent, failed, or got replies;
- handle opt-outs, interested replies, follow-ups, and meeting booking;
- package the whole workflow as a Hermes-powered setup/operations system.

Do **not** use this skill for:

- mass spam, consumer blasting, or unqualified scraping;
- bypassing WhatsApp restrictions or platform enforcement;
- sending identical messages at high speed;
- contacting opt-outs again;
- inventing credentials, API responses, send results, or CRM state.

## Operating Rules

1. **Inspect first.** Check existing config, CRM, auth, commands, scripts, and running processes before asking questions.
2. **Ask only for missing inputs.** If Hermes can discover or create something safely, do it instead of asking.
3. **Dry-run before real sends.** Real outbound requires explicit enablement and a preview of selected leads.
4. **Sequential only.** First-contact WhatsApp sends must never be parallelized.
5. **Small batches.** Default batch size is 5–12. Same-day batches above 12 must be split.
6. **Random delays.** Default delay is 300–900 seconds between first-contact sends.
7. **Log everything.** Every selected lead, send attempt, provider ID, status, error, and CRM update must be logged.
8. **Verify before reporting success.** Do not report “sent” until the provider returned success plus a message ID/destination and the CRM/log reflects it.
9. **Respect opt-outs.** If someone says no, send exactly: `Entendido, não te chamo novamente.` Then mark opt-out and stop future contact.
10. **Keep reply capture active.** If `wacli sync --follow` conflicts with sends, pause it during sends and run short `sync --once` passes during delays or immediately after each send.

## Setup Wizard

When the user asks to install, configure, or start this system, Hermes should follow this wizard in order. Each step has a completion criterion.

### Step 1 — Discover the environment

Run checks for required commands and existing files:

```bash
command -v wacli || true
command -v apify || true
command -v node || true
command -v python3 || true
command -v gogw || command -v gws || true
```

Also inspect the intended project directory, usually one of:

```text
~/agency_ops
~/outbound_ops
./agency_ops
```

Completion criterion:

- required local directory chosen or created;
- available commands listed;
- missing commands identified;
- no credentials printed to chat.

### Step 2 — Ask for only the missing decisions

If not already configured, ask the user for:

| Input | Why it is needed | Example |
|---|---|---|
| Agency/operator name | Message sender identity | `Matheus` |
| Offer | What the outreach sells | `AI prospecting system for agencies` |
| ICP | Who to source/contact | `marketing agencies` |
| City/region | Google Maps search area | `Curitiba`, `São Paulo`, `Brazil` |
| Authority proof | Trust signal | `@handle with 29k followers` |
| CRM backend | Where leads/logs live | Google Sheets, Airtable, local SQLite |
| WhatsApp sender | Which account to connect | Business or personal WhatsApp number |
| Daily send cap | Anti-ban safety limit | 12/day, 24/day split 12+12 |
| Delay range | Send pacing | 5–15 min |
| Calendar link/tool | Meeting booking | Google Calendar, Calendly |

Ask these as a compact checklist. Do not ask for API keys in chat. Tell the user to set secrets locally through environment variables or CLI login flows.

Completion criterion:

- all operational choices have values;
- secrets are still outside chat;
- config file can be written.

### Step 3 — Create local config

Create a local config file such as:

```json
{
  "agency_name": "{AGENCY_NAME}",
  "operator_name": "{OPERATOR_NAME}",
  "offer": "{OFFER}",
  "icp": "{ICP}",
  "default_city": "{CITY}",
  "authority_line": "{AUTHORITY_LINE}",
  "crm_backend": "google_sheets",
  "spreadsheet_id": "",
  "google_account": "",
  "wacli_command": "/usr/local/bin/wacli",
  "wacli_store": "~/.local/state/wacli",
  "campaign_id": "agency_outbound_v1",
  "daily_limit": 12,
  "batch_size": 12,
  "min_delay_seconds": 300,
  "max_delay_seconds": 900
}
```

Recommended path:

```text
~/agency_ops/config.json
```

Completion criterion:

- config exists;
- no secret tokens are embedded;
- later scripts read from this config instead of hard-coded values.

## CRM Setup

### Recommended CRM tabs

For Google Sheets, create these tabs:

| Tab | Purpose |
|---|---|
| `Leads` | Canonical lead database |
| `Envios` | One row per outbound send attempt |
| `Respostas` | Captured inbound replies and classifications |
| `Logs` | Operational events, errors, imports, sync runs |
| `Config` | Non-secret campaign settings visible to the user |

### `Leads` columns

Use these headers exactly unless adapting an existing CRM:

```text
ID Lead
Empresa
Contato
Telefone
WhatsApp JID
Cidade
Nicho
Site
Origem
Tipo lead
Status
Mensagem variante
Dor principal
Oportunidade percebida
Último contato em
Próximo follow-up
Qtde follow-ups
Respondeu?
Classificação resposta
Data criação
Última atualização
Observações
```

Recommended `Status` values:

| Status | Meaning |
|---|---|
| `novo` | eligible for first contact |
| `enviando` | claimed by a currently running batch |
| `contato_iniciado` | first contact confirmed by provider |
| `respondeu` | inbound reply captured |
| `interessado` | positive/permission reply |
| `reuniao_marcada` | meeting booked |
| `opt_out` | asked not to be contacted |
| `erro` | send/import/sync problem |
| `duplicado` | duplicate row retained for audit |

### `Envios` columns

```text
Data/Hora
ID Lead
Empresa
Telefone
Mensagem
Status
Provider msg_id
Destino/JID
Erro
Campanha
Mensagem variante
```

A send is confirmed only when:

- provider status is success;
- provider message ID is non-empty;
- destination/JID is non-empty;
- CRM/log row was appended.

### `Respostas` columns

```text
Data/Hora
ID Lead
Empresa
Telefone/JID
Mensagem recebida
Classificação
Ação tomada
Próximo passo
```

### `Logs` columns

```text
Data/Hora
Sistema
Ação
Status
Detalhes
Run ID
```

### CRM creation options

If Google Sheets tooling is available, create the spreadsheet and tabs through the configured Google CLI/API. If not, create a local CSV/SQLite CRM first and tell the user how to connect Google Sheets later.

Completion criterion:

- CRM exists;
- tabs/columns match the schema;
- a test read/write succeeds;
- dedupe by normalized phone and normalized company name works.

## Apify Google Maps Lead Sourcing

### What to use

Use Apify Google Maps Scraper or an equivalent Apify actor that returns businesses from Google Maps. A commonly used actor is:

```text
compass/crawler-google-places
```

Do not assume a direct Google Places API key exists. Prefer Apify when the user says “pegar leads do Google Maps”, “buscar agências”, “colocar contatos no CRM”, or similar.

### Credential setup

First check whether Apify CLI is installed:

```bash
apify --version
apify info || true
```

If the CLI is missing, install according to the current Apify docs or ask the user which install method they prefer. If the CLI exists but is not authenticated, tell the user to run the Apify login flow locally. Do not ask them to paste the API token into chat.

Typical user-side setup:

```bash
apify login
```

Alternative environment-based setup, if the user wants automation:

```bash
export APIFY_TOKEN="..."   # user sets locally, not in chat
```

Completion criterion:

- `apify` command works;
- account/auth status is confirmed without exposing token;
- a small test actor run succeeds or a clear auth/setup blocker is reported.

### Search input template

Create an input JSON per sourcing run:

```json
{
  "searchString": "{ICP} {CITY}",
  "maxCrawledPlaces": 40,
  "language": "pt-BR",
  "proxyConfig": { "useApifyProxy": true }
}
```

Examples:

```text
agência de marketing Curitiba
agência de tráfego pago São Paulo
clínica estética Curitiba
escritório contabilidade Belo Horizonte
```

Run pattern:

```bash
cd ~/agency_ops
apify call compass/crawler-google-places --input-file apify_input.json --output-dataset --silent > apify_results.json
```

### Import rules

For each returned place:

1. Extract company name, phone, website, city, category, address, rating/reviews if available.
2. Normalize phone to E.164-ish digits. For Brazil, prefix `55` when needed.
3. Dedupe against existing CRM by normalized phone, company name, website/domain, and external place ID when available.
4. Skip rows with missing phone unless the user explicitly wants manual enrichment.
5. Append only qualified, non-duplicate leads with `Status = novo` and `Mensagem variante = recomendada`.
6. Log import counts: fetched, valid, duplicates, appended, skipped.

Completion criterion:

- CRM has enough `novo` leads for the requested batch;
- duplicate count is known;
- source run is logged;
- no real send has happened yet.

## WhatsApp via wacli

### Install/check

Check:

```bash
wacli --help
wacli auth status --json || true
```

If missing, install `wacli` from its official source for the user's environment. Do not guess an installer if unknown; ask the user for the preferred source or consult official docs.

### Authentication

Typical flow:

```bash
wacli auth login
```

The user must complete the QR/pairing flow on their phone:

```text
WhatsApp → Settings → Linked devices → Link a device
```

Never expose QR codes, pairing codes, tokens, session files, cookies, or store contents.

### Test send

Use a number controlled by the user:

```bash
wacli send text \
  --to "{TEST_PHONE_E164}" \
  --message "Teste de conexão do sistema outbound" \
  --json
```

Completion criterion:

- auth status reports authenticated;
- test send returns success;
- message ID and destination are present;
- reply capture path is available.

### Reply capture

Use a continuous sync process if safe:

```bash
wacli sync --follow --max-messages 50000 --max-db-size 2GB --events
```

If continuous sync conflicts with sending because both need the same store lock, use the safer pattern:

1. Stop/pause `sync --follow` before the batch.
2. Send one message.
3. Run short sync after the send or during the delay:
   ```bash
   wacli sync --once --idle-exit 20s --max-messages 50000 --max-db-size 2GB --events
   ```
4. Sleep random delay.
5. Repeat.
6. Restart `sync --follow` after the batch.

Completion criterion:

- inbound replies can be read from the local store/provider;
- sync is not permanently disabled after a batch.

## Message Strategy

### Psychological principles

Cold outreach should create the conditions for a reply, not just present an offer.

Use these principles:

| Principle | Implementation |
|---|---|
| Pattern interrupt | Avoid messages that look like polished mass sales templates |
| Curiosity gap | Imply a real, specific observation the reader may want explained |
| Specificity | Use company, niche, city, or a concrete operating problem |
| Loss framing | Show the cost of inaction on a real market dynamic, not fake urgency |
| Small CTA | Ask permission to send a summary/demo before pushing a meeting |
| Human tone | Clear and natural; not over-polished, not sloppy |

### First-contact structure

Required elements:

1. Human greeting.
2. Sender identity or authority.
3. Specific reason this company was contacted.
4. One concise value proposition.
5. Small CTA.
6. Opt-out line.

Generic template:

```text
Oi, tudo bem? Sou {NOME}. {AUTORIDADE}

Vi a {EMPRESA} em {CIDADE} e me chamou atenção um ponto: muitas empresas parecidas com vocês ainda dependem de {PROBLEMA_ATUAL}, mas poderiam criar uma esteira mais previsível usando IA.

Montei uma estrutura que busca leads, personaliza abordagens, envia em cadência segura pelo WhatsApp e organiza respostas/follow-ups no CRM.

Quer que eu te mande um resumo rápido de como isso ficaria aplicado aí?

Se não fizer sentido, me avisa que eu não te chamo novamente.
```

Short pattern-interrupt variant:

```text
Oi, {NOME/EMPRESA}. Vi a {EMPRESA} e pensei numa aplicação bem prática de IA para prospecção de vocês.

Sou {NOME}. {AUTORIDADE}

A ideia é montar uma esteira que encontra leads, personaliza mensagens e ajuda a gerar reuniões sem depender tanto de indicação ou trabalho manual.

Posso te mandar um resumo rápido?
```

### Variation rules

Vary naturally between sends:

| Block | Example variations |
|---|---|
| Opener | `Oi, tudo bem?`, `Olá, tudo certo?`, `Oi!` |
| Company line | `Vi a {EMPRESA}`, `Dei uma olhada na {EMPRESA}`, `Encontrei a {EMPRESA}` |
| Problem | indicação, tráfego caro, falta de SDR, follow-up manual, CRM desorganizado |
| CTA | `Posso te mandar um resumo?`, `Faz sentido eu te mostrar?`, `Quer ver a ideia?` |
| Opt-out | Keep the meaning stable and respectful |

Do not randomize so much that the message sounds fake. Do not send identical first-contact messages consecutively.

## Anti-Ban Sending Workflow

### Default limits

| Setting | Default |
|---|---|
| First-contact batch size | 5–12 |
| Daily cap for new accounts | 5–12 |
| Daily cap for warmer accounts | 12–24, split into sub-batches |
| Delay between sends | 300–900 seconds |
| Workers | 1 |
| Real-send flag | required |

### Real-send environment pattern

Scripts should default to dry-run unless explicitly enabled:

```bash
OUTBOUND_ENABLED=1 \
OUTBOUND_BATCH_SIZE=12 \
OUTBOUND_DAILY_LIMIT=24 \
OUTBOUND_MIN_DELAY_SECONDS=300 \
OUTBOUND_MAX_DELAY_SECONDS=900 \
python3 send_batch.py
```

### Batch algorithm

1. Acquire a process lock.
2. Read CRM.
3. Count already-sent rows for today.
4. Select `Status = novo` leads up to `min(batch_size, daily_limit - sent_today)`.
5. Print dry-run preview if real-send flag is not set.
6. For real send:
   - claim row as `enviando`;
   - render a varied message;
   - send via provider;
   - require provider message ID and destination;
   - append `Envios` row;
   - update lead status;
   - run short sync pass;
   - sleep random delay.
7. Stop the whole batch on auth errors, restrictions, rate-limit signals, repeated failures, or lock problems.

### Split batches

For requests above the per-run cap, split the day:

| Request | Plan |
|---|---|
| 20 contacts today | 10 now + 10 later, or 12 now + 8 later |
| 24 contacts today | 12 now + 12 later |
| 30+ contacts | ask about risk; recommend spreading across days/accounts |

Second-batch script must:

- verify WhatsApp auth again;
- wait if the first batch is still running;
- dry-run immediately before sending;
- use the same `DAILY_LIMIT` as the total target;
- report real sent/error counts.

Completion criterion:

- first sub-batch started or completed with logs;
- later sub-batch scheduled if requested;
- user is told what is confirmed vs. still pending.

## Reply Handling

### Classification table

| Reply | Classification | Action |
|---|---|---|
| `pode mandar`, `manda`, `me mostra` | `permission_to_send` | Send short explanation/demo; do not push meeting yet |
| `tenho interesse`, `quero saber mais` | `interessado` | Send context and ask about their operation/niche |
| `quanto custa?` | `pricing_question` | Give context first; offer call/demo before exact quote unless pricing is fixed |
| `vamos marcar`, `pode amanhã` | `meeting_ready` | Offer two time windows and book calendar |
| `não tenho interesse`, `não precisa` | `opt_out` | Send opt-out confirmation and stop |
| `ok`, emoji, ambiguous | `ambiguous` | Ask one simple clarifying question or escalate to user |

### Response after permission

```text
Boa! Vou te mostrar por aqui primeiro.

A ideia é uma esteira de prospecção com IA: define o perfil de cliente ideal, busca empresas com potencial, organiza no CRM, gera abordagens personalizadas, envia pelo WhatsApp em cadência segura, acompanha respostas e faz follow-up.

O objetivo é gerar mais conversas comerciais sem depender tanto de prospecção manual.

Se fizer sentido, posso te mandar um vídeo curto mostrando o fluxo ou adaptar um exemplo para o tipo de cliente que vocês querem prospectar.
```

### Meeting CTA

Use only after a real buying signal:

```text
Pelo que você comentou, acho que vale mapear em 15 min se isso encaixa na operação de vocês.

Amanhã de manhã funciona para uma conversa rápida?
```

### Opt-out

If negative:

```text
Entendido, não te chamo novamente.
```

Then update CRM:

- `Status = opt_out`
- `Respondeu? = sim`
- clear future follow-up date
- add timestamped note

## Daily Operations

### Start-of-day checklist

- [ ] WhatsApp authenticated
- [ ] CRM has enough `novo` leads
- [ ] No overlapping send process
- [ ] Sync is active or short-sync pattern is configured
- [ ] Yesterday's replies classified
- [ ] Opt-outs excluded
- [ ] Dry-run preview reviewed

### Running a batch

1. Check eligible leads.
2. Source/import more leads if eligible count is too low.
3. Run dry-run.
4. Start real send in background for long batches.
5. Use completion notifications for bounded long-running processes.
6. Verify logs and CRM after completion.
7. Restart/verify reply sync.

### Reporting format

```text
Batch concluído.

- Selecionados: 12
- Enviados confirmados: 12
- Falhas: 0
- Modo: sequencial, delay aleatório 5–15 min
- CRM/logs: atualizados
- Sync/inbox: ativo novamente
- Respostas novas: 1

Próximo passo: responder interessados com resumo/demo; não pedir reunião cedo demais.
```

If a batch is still in progress:

```text
Batch iniciado, ainda em andamento.

- Primeiro envio confirmado: sim/não
- Enviados até agora: X
- Falhas até agora: Y
- Próximo lote: agendado para HH:MM
- Relatório final: agendado para HH:MM
```

## Implementation Files

A typical implementation can create:

```text
~/agency_ops/
  config.json
  crm.py
  source_apify_google_maps.py
  import_leads.py
  send_batch.py
  inbox_scan.py
  report.py
  logs/
  data/
```

### `send_batch.py` requirements

- dry-run by default;
- explicit `OUTBOUND_ENABLED=1` for real sends;
- process lock;
- daily cap;
- per-run cap;
- sequential sends only;
- random delay;
- risk stop on auth/restriction/rate-limit errors;
- provider message ID required;
- CRM update after confirmed send only;
- append send log;
- run sync after sends or delays;
- print JSON summary at the end.

### `inbox_scan.py` requirements

- sync before scanning when needed;
- map replies by WhatsApp JID first, then normalized phone;
- update `Respostas` and `Leads`;
- classify replies;
- auto-send only approved safe responses if the user has allowed automation;
- escalate ambiguous replies to the user.

### `report.py` requirements

- count leads imported today;
- count sent/failed today;
- count replies and classifications;
- list meetings booked;
- list blockers;
- keep report human-readable.

## Troubleshooting

### `wacli send` appears stuck

Likely cause: `wacli sync --follow` holds the same store lock.

Fix:

```bash
ps -eo pid,ppid,stat,etime,cmd | egrep 'send_batch|wacli sync|wacli send' | grep -v egrep || true
```

Stop or pause the continuous sync, let the send complete, then use short sync passes and restart sync after the batch.

### Batch sent zero messages

Check:

- no `Status = novo` leads;
- daily cap already reached;
- all selected leads already appear in `Envios`;
- `Mensagem variante` filter does not match;
- phone column is empty or not normalized.

Fix by importing more leads or correcting statuses, then rerun dry-run.

### Replies not showing in CRM

Do not assume there are no replies from the CRM alone. Verify directly in the WhatsApp store/provider:

1. Run `wacli sync --once`.
2. Find the destination JID from the `Envios` row.
3. Inspect messages for that JID.
4. Only then report whether a reply was captured.

### Too many failures or auth errors

Stop immediately. Do not retry aggressively. Verify auth, account health, network, provider output, and whether WhatsApp requires re-linking.

## Security and Compliance

- Never print or store API tokens in chat.
- Never expose WhatsApp QR codes or session stores.
- Respect opt-outs permanently.
- Keep volume conservative and targeted.
- Avoid deceptive claims, fake scarcity, and misleading personalization.
- Check local legal/compliance requirements before cold outreach.
- Make it easy for recipients to say no.

## Verification Checklist

Before saying the system is installed:

- [ ] Config exists and contains no secrets.
- [ ] CRM exists with required tabs/columns.
- [ ] CRM read/write test passed.
- [ ] Apify CLI or equivalent sourcing path is authenticated/tested.
- [ ] At least one lead sourcing dry-run succeeded.
- [ ] Import dedupe works.
- [ ] `wacli` is installed and authenticated.
- [ ] WhatsApp test send returned message ID and destination.
- [ ] Inbox sync/reply capture works.
- [ ] Send script dry-run previews selected leads.
- [ ] Real send requires explicit enable flag.
- [ ] Anti-ban delay and daily cap are enforced.
- [ ] Logs are written for imports, sends, replies, and errors.
- [ ] Opt-out handling is implemented.
- [ ] Final report command works.

Before saying a batch succeeded:

- [ ] Process completed or is intentionally still running.
- [ ] Selected count is known.
- [ ] Confirmed sent count is based on provider message IDs.
- [ ] Error count reviewed.
- [ ] CRM and send logs updated.
- [ ] No duplicate first contacts sent.
- [ ] Sync/inbox capture verified after batch.
- [ ] User-facing report distinguishes confirmed results from scheduled/pending work.

## One-Shot Recipes

### Install/setup from scratch

1. Inspect commands and existing files.
2. Ask for missing setup values.
3. Create config and CRM.
4. Authenticate Apify and `wacli` through local CLI flows.
5. Source a small test lead set.
6. Import/dedupe into CRM.
7. Run send dry-run.
8. Send one test message to the user's own number.
9. Verify reply capture.
10. Report what is ready and what is blocked.

### Source 40 new Google Maps leads

1. Build Apify input for `{ICP} {CITY}`.
2. Run actor.
3. Normalize and dedupe results.
4. Append qualified leads as `novo`.
5. Log fetched/valid/duplicate/appended counts.

### Send 12 contacts today

1. Verify auth and no overlapping process.
2. Count `novo` leads.
3. Source/import more if needed.
4. Dry-run 12 selected leads.
5. Run real send with delay 300–900 seconds.
6. Verify provider IDs, CRM, logs, and sync.
7. Report confirmed counts.

### Send 24 contacts today

1. Verify there are at least 24 eligible leads or import more.
2. Dry-run first 12.
3. Start first 12 in background with completion notification.
4. Schedule second 12 for later the same day.
5. Schedule final verification after both batches.
6. Report first confirmed send, scheduled jobs, and final verification time. Do not claim all 24 are sent until confirmed.

### Check if anyone replied

1. Run sync.
2. Read today's/yesterday's `Envios` rows.
3. Map each lead to destination JID.
4. Inspect inbound messages by JID/phone.
5. Update `Respostas` and classifications.
6. Report counts and recommended next actions.

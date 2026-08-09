import Dexie, { type Table } from "dexie";
import type { Delivery, DeliveryApp, Expense } from "./types";

// ===== Banco de dados local do MeuCorre — ISOLADO POR USUÁRIO =====
//
// Cada usuário logado tem seu próprio IndexedDB (ex: MeuCorreDB_user123).
// Isso garante isolamento total: usuário A nunca vê dados do usuário B,
// mesmo no mesmo dispositivo/navegador.
//
// O `db` exportado é um Proxy que redireciona todas as chamadas para
// o database ativo atual. Quando o usuário faz login/logout, chamamos
// `switchDb(userId)` para trocar o database ativo.

const STORAGE_KEY_USER_ID = "meucorre_user_id";

class MeuCorreDB extends Dexie {
  deliveries!: Table<Delivery, number>;
  expenses!: Table<Expense, number>;
  apps!: Table<DeliveryApp, number>;

  constructor(dbName: string) {
    super(dbName);

    this.version(1).stores({
      deliveries: "++id, app, value, km, date, timestamp",
    });

    this.version(2).stores({
      deliveries: "++id, app, value, km, date, timestamp",
      expenses: "++id, category, value, date, timestamp",
      apps: "++id, &name, order, isDefault",
    });

    // Seed dos apps padrão ao abrir (se a tabela estiver vazia)
    this.on("populate", async () => {
      const defaults = DEFAULT_APPS.map((a, i) => ({
        ...a,
        isDefault: true,
        order: i,
      }));
      await this.apps.bulkAdd(defaults);
    });
  }
}

// Apps padrão (built-in) com logos locais em /public/apps/.
// Imagens locais são mais rápidas (mesmo domínio, sem CDN externo) e
// mais confiáveis (sem risco de CDN sair do ar ou bloquear hotlinking).
export const DEFAULT_APPS: Omit<DeliveryApp, "id" | "isDefault" | "order">[] = [
  {
    name: "iFood",
    label: "iFood",
    color: "#ef4444",
    emoji: "🍽️",
    image: "/apps/ifood.png",
  },
  {
    name: "99Food",
    label: "99Food",
    color: "#f97316",
    emoji: "🟠",
    image: "/apps/99food.jpg",
  },
  {
    name: "Lalamove",
    label: "Lalamove",
    color: "#f59e0b",
    emoji: "📦",
    image: "/apps/Lalamove.jpg",
  },
  {
    name: "Rappi",
    label: "Rappi",
    color: "#ec4899",
    emoji: "🛍️",
    image: "/apps/Rappi.jpg",
  },
  {
    name: "Loggi",
    label: "Loggi",
    color: "#3b82f6",
    emoji: "📮",
    image: "/apps/Loggi.jpg",
  },
  {
    name: "Ryd",
    label: "Ryd",
    color: "#8b5cf6",
    emoji: "🚗",
    image: "/apps/ryd.png",
  },
  {
    name: "Bee",
    label: "Bee",
    color: "#eab308",
    emoji: "🐝",
    image: "/apps/bee.png",
  },
  {
    name: "Independente/Outros",
    label: "Independente / Outros",
    color: "#10b981",
    emoji: "🚀",
    image: "/apps/Independente-Outros.jpg",
  },
];

// ===== Database ativo (pode ser trocado por switchDb) =====

let activeDb: MeuCorreDB | null = null;
const dbCache = new Map<string, MeuCorreDB>();

function getDbName(): string {
  if (typeof window === "undefined") return "MeuCorreDB";
  const userId = localStorage.getItem(STORAGE_KEY_USER_ID);
  return userId ? `MeuCorreDB_${userId}` : "MeuCorreDB_anon";
}

function getOrCreateDb(): MeuCorreDB {
  const dbName = getDbName();
  let db = dbCache.get(dbName);
  if (!db) {
    db = new MeuCorreDB(dbName);
    dbCache.set(dbName, db);
  }
  return db;
}

// Troca o database ativo para o do usuário especificado.
// Chamado no login/logout.
// CRÍTICO: fecha o DB anterior (libera handles do IndexedDB), limpa o cache
// e emite um evento "meucorre-db-switched" para que useLiveQuery se re-inscreva
// no novo DB. Sem isso, o dashboard mostra dados do usuário anterior até
// que um reload completo aconteça (race condition pós-login).
export function switchDb(userId: string | null) {
  if (typeof window === "undefined") return;
  if (userId) {
    localStorage.setItem(STORAGE_KEY_USER_ID, userId);
  } else {
    localStorage.removeItem(STORAGE_KEY_USER_ID);
  }

  // Fecha TODOS os DBs cached e limpa o cache — previne que o useLiveQuery
  // continue lendo do DB do usuário anterior.
  for (const dbInstance of dbCache.values()) {
    try {
      dbInstance.close();
    } catch {
      // ignore — DB já pode estar fechado
    }
  }
  dbCache.clear();
  activeDb = null;

  // Cria o novo DB ativo
  activeDb = getOrCreateDb();

  // Emite evento para que hooks re-inscrevam no novo DB
  window.dispatchEvent(
    new CustomEvent("meucorre-db-switched", { detail: { userId, dbName: activeDb.name } }),
  );
}

// Inicializa o database ativo (lazy init no client)
// SEMPRE verifica se o userId mudou desde a última chamada
function getActiveDb(): MeuCorreDB {
  const expectedName = getDbName();
  if (!activeDb || activeDb.name !== expectedName) {
    activeDb = getOrCreateDb();
  }
  return activeDb;
}

// Objeto mutável que SEMPRE aponta para o database ativo.
// Usando getter em vez de Proxy para garantir que Table do Dexie
// (que são getters na classe) funcionem corretamente.
export const db = {
  get deliveries() {
    return getActiveDb().deliveries;
  },
  get expenses() {
    return getActiveDb().expenses;
  },
  get apps() {
    return getActiveDb().apps;
  },
  // Métodos do Dexie que usamos
  get open() {
    return getActiveDb().open.bind(getActiveDb());
  },
  get close() {
    return getActiveDb().close.bind(getActiveDb());
  },
  get transaction() {
    return getActiveDb().transaction.bind(getActiveDb());
  },
  get name() {
    return getActiveDb().name;
  },
  get on() {
    return getActiveDb().on.bind(getActiveDb());
  },
} as unknown as MeuCorreDB;

// Garante que os apps padrão existam (roda no client, idempotente).
// Também migra apps existentes para novas imagens locais (se URLs mudaram)
// e adiciona novos apps padrão (Ryd, Bee) que não existiam antes.
export async function ensureDefaultApps() {
  const current = getActiveDb();
  const count = await current.apps.count();

  // 1. Se tabela vazia → seed com todos os apps padrão
  if (count === 0) {
    await current.apps.bulkAdd(
      DEFAULT_APPS.map((a, i) => ({ ...a, isDefault: true, order: i })),
    );
    return;
  }

  // 2. Migração: atualiza imagens de apps padrão existentes (CDN → local)
  // e adiciona novos apps padrão (Ryd, Bee) que não existiam antes.
  const existingApps = await current.apps.toArray();
  const existingNames = new Set(existingApps.map((a) => a.name));

  for (const defaultApp of DEFAULT_APPS) {
    if (!existingNames.has(defaultApp.name)) {
      // Novo app padrão (Ryd, Bee) — adiciona com próximo order
      const maxOrder = existingApps.reduce(
        (max, a) => Math.max(max, a.order ?? 0),
        0,
      );
      await current.apps.add({
        ...defaultApp,
        isDefault: true,
        order: maxOrder + 1,
      });
    } else {
      // App existente — atualiza imagem se mudou (CDN → local)
      const existing = existingApps.find((a) => a.name === defaultApp.name);
      if (existing && existing.isDefault && existing.image !== defaultApp.image) {
        await current.apps.update(existing.id!, { image: defaultApp.image });
      }
    }
  }
}

import Dexie, { type Table } from "dexie";
import type { Delivery, DeliveryApp, Expense } from "./types";

// Banco de dados local do MeuCorre.
// Padrão Local-First: dados ficam 100% no dispositivo do entregador.
// Zero servidor, zero latência, funciona offline, privacidade total.

class MeuCorreDB extends Dexie {
  deliveries!: Table<Delivery, number>;
  expenses!: Table<Expense, number>;
  apps!: Table<DeliveryApp, number>;

  constructor() {
    super("MeuCorreDB");

    // v1: somente deliveries
    this.version(1).stores({
      deliveries: "++id, app, value, km, date, timestamp",
    });

    // v2: adiciona expenses, apps (CRUD de apps customizados)
    // Mantém schema do deliveries igual.
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

// Apps padrão (built-in). Cores aproximadas das marcas.
// O usuário pode adicionar mais (com upload de imagem) ou ocultar.
export const DEFAULT_APPS: Omit<DeliveryApp, "id" | "isDefault" | "order">[] = [
  { name: "iFood", label: "iFood", color: "#ef4444", emoji: "🍽️" },
  { name: "99Food", label: "99Food", color: "#f97316", emoji: "🟠" },
  { name: "Lalamove", label: "Lalamove", color: "#f59e0b", emoji: "📦" },
  { name: "Rappi", label: "Rappi", color: "#ec4899", emoji: "🛍️" },
  { name: "Loggi", label: "Loggi", color: "#3b82f6", emoji: "📮" },
  { name: "Independente/Outros", label: "Independente / Outros", color: "#10b981", emoji: "🚀" },
];

// Singleton — evita reabrir conexões em HMR do Next.js.
declare global {
  var __meucorre_db: MeuCorreDB | undefined;
}

export const db: MeuCorreDB =
  globalThis.__meucorre_db ?? (globalThis.__meucorre_db = new MeuCorreDB());

// Garante que os apps padrão existam (roda no client, idempotente).
export async function ensureDefaultApps() {
  const count = await db.apps.count();
  if (count === 0) {
    await db.apps.bulkAdd(
      DEFAULT_APPS.map((a, i) => ({ ...a, isDefault: true, order: i })),
    );
  }
}

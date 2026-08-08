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

// Apps padrão (built-in) com logos oficiais via CDN.
// Cores aproximadas das marcas.
// O usuário pode adicionar mais (com upload de imagem) ou ocultar.
export const DEFAULT_APPS: Omit<DeliveryApp, "id" | "isDefault" | "order">[] = [
  {
    name: "iFood",
    label: "iFood",
    color: "#ef4444",
    emoji: "🍽️",
    image:
      "https://purepng.com/public/uploads/large/purepng.com-ifood-logofood-delivery-ifood-brazil-delivery-logo-931523647772rfdqz.png",
  },
  {
    name: "99Food",
    label: "99Food",
    color: "#f97316",
    emoji: "🟠",
    image:
      "https://logodownload.org/wp-content/uploads/2020/02/99food-logo.png",
  },
  {
    name: "Lalamove",
    label: "Lalamove",
    color: "#f59e0b",
    emoji: "📦",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Lalamove_logo.svg/512px-Lalamove_logo.svg.png",
  },
  {
    name: "Rappi",
    label: "Rappi",
    color: "#ec4899",
    emoji: "🛍️",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Rappi_logo.svg/512px-Rappi_logo.svg.png",
  },
  {
    name: "Loggi",
    label: "Loggi",
    color: "#3b82f6",
    emoji: "📮",
    image:
      "https://loggi.com/static/img/loggi-logo.png",
  },
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
